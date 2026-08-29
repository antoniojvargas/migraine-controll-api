import { DeepPartial } from 'typeorm';
import { MigraineLog } from '@/domain/migraine-log';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';
import { MigraineLogEntity } from '@/infra/database/entities';
import { CreateMigraineLogInputDto } from '@/dto/create-migraine-log-input.dto';
import { MigraineLogOutputDto, RecurrentSymptomOutputDto } from '@/dto/migraine-log-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { notifyUsers } from './notification/notificationHelpers';
import { UseCaseInterface } from './usecase.interface';
import { UserResponseBaseUc } from './user-response-base.uc';

export class CreateMigraineLogUc
  extends UserResponseBaseUc
  implements UseCaseInterface<CreateMigraineLogInputDto, MigraineLogOutputDto>
{
  private readonly migraineLogRepository: MigraineLogRepository;
  private readonly pushNotificationTokenRepository: PushNotificationTokenRepository;

  constructor(
    migraineLogRepository: MigraineLogRepository,
    preferredAnswersRepository: PreferredAnswersRepository,
    userResponseRepository: UserResponseRepository,
    questionRepository: QuestionRepository,
    selectionRepository: SelectionRepository,
    translationRepository: TranslationRepository,
    pushNotificationTokenRepository: PushNotificationTokenRepository,
  ) {
    super(
      userResponseRepository,
      questionRepository,
      selectionRepository,
      translationRepository,
      preferredAnswersRepository,
    );
    this.migraineLogRepository = migraineLogRepository;
    this.pushNotificationTokenRepository = pushNotificationTokenRepository;
  }

  execute = async (input: CreateMigraineLogInputDto): Promise<MigraineLogOutputDto> => {
    try {
      const { responses = [], ...logDto } = input;
      const log = MigraineLog.createNewMigraineLog(logDto);
      const persistedLog = await this.migraineLogRepository.create(this.mapLogToEntity(log));
      log.assignId(persistedLog.id);

      const domainResponses = await this.persistUserResponses({
        userId: log.userId,
        items: responses,
        migraineLogId: persistedLog.id,
        upsertPreferred: true,
      });

      const recurrentSymptoms = await this.detectRecurrentSymptoms(log.userId);
      await this.onRecurrentSymptomsDetected(recurrentSymptoms, log.userId);

      return {
        id: persistedLog.id,
        userId: log.userId,
        sessionId: log.sessionId,
        intensity: log.intensity,
        painLocation: log.painLocation,
        startedAt: log.startedAt,
        endedAt: log.endedAt,
        responses: domainResponses.map((response) => this.toOutput(response)),
        recurrentSymptoms,
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private async detectRecurrentSymptoms(userId: string): Promise<RecurrentSymptomOutputDto[]> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await this.userResponseRepository
      .createQueryBuilder('ur')
      .innerJoin('ur.migraineLog', 'ml')
      .select('ur.selection_id', 'selectionId')
      .addSelect('ur.answer_text', 'answerText')
      .addSelect('COUNT(*)', 'occurrences')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ml.started_at >= :since', { since })
      .groupBy('ur.selection_id')
      .addGroupBy('ur.answer_text')
      .getRawMany();
    return rows
      .map((row) => ({
        selectionId: (row.selectionId as string | null) ?? null,
        answerText: (row.answerText as string | null) ?? null,
        occurrences: Number(row.occurrences),
      }))
      .filter((symptom) => symptom.occurrences >= 5);
  }

  protected async onRecurrentSymptomsDetected(
    symptoms: RecurrentSymptomOutputDto[],
    userId: string,
  ): Promise<void> {
    if (symptoms.length === 0) {
      return;
    }

    const tokens = await this.pushNotificationTokenRepository.findAllBy({ user: { id: userId } });

    await Promise.all(
      symptoms.map((symptom) =>
        notifyUsers([{ userId, tokens }], {
          title: 'Recurring symptom detected',
          body: `You've logged "${symptom.answerText ?? symptom.selectionId}" ${symptom.occurrences} times in the last 30 days. Consider adding it to your profile.`,
          data: {
            selectionId: symptom.selectionId ?? '',
            occurrences: String(symptom.occurrences),
          },
        }),
      ),
    );
  }

  private mapLogToEntity(log: MigraineLog): DeepPartial<MigraineLogEntity> {
    return {
      user: { id: log.userId },
      session: log.sessionId !== null ? { id: log.sessionId } : undefined,
      intensity: log.intensity,
      painLocation: log.painLocation,
      startedAt: log.startedAt,
      endedAt: log.endedAt,
    };
  }
}
