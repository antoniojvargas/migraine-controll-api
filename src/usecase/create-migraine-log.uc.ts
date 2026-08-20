import { DeepPartial } from 'typeorm';
import { MigraineLog } from '@/domain/migraine-log';
import { Question } from '@/domain/question';
import { UserResponse } from '@/domain/user-response';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { MigraineLogEntity, UserResponseEntity } from '@/infra/database/entities';
import { CreateMigraineLogInputDto } from '@/dto/create-migraine-log-input.dto';
import { MigraineLogOutputDto } from '@/dto/migraine-log-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { UserResponseBaseUc, ResolvedAnswer } from './user-response-base.uc';

export class CreateMigraineLogUc
  extends UserResponseBaseUc
  implements UseCaseInterface<CreateMigraineLogInputDto, MigraineLogOutputDto>
{
  private readonly migraineLogRepository: MigraineLogRepository;
  private readonly preferredAnswersRepository: PreferredAnswersRepository;

  constructor(
    migraineLogRepository: MigraineLogRepository,
    preferredAnswersRepository: PreferredAnswersRepository,
    userResponseRepository: UserResponseRepository,
    questionRepository: QuestionRepository,
    selectionRepository: SelectionRepository,
    translationRepository: TranslationRepository,
  ) {
    super(userResponseRepository, questionRepository, selectionRepository, translationRepository);
    this.migraineLogRepository = migraineLogRepository;
    this.preferredAnswersRepository = preferredAnswersRepository;
  }

  execute = async (input: CreateMigraineLogInputDto): Promise<MigraineLogOutputDto> => {
    try {
      const { responses = [], ...logDto } = input;
      const log = MigraineLog.createNewMigraineLog(logDto);
      const persistedLog = await this.migraineLogRepository.create(this.mapLogToEntity(log));
      log.assignId(persistedLog.id);

      const questionCache = new Map<string, Question>();
      const domainResponses: UserResponse[] = [];
      const responseEntities: DeepPartial<UserResponseEntity>[] = [];
      for (const item of responses) {
        const question = await this.loadQuestion(item.questionId, questionCache);
        const resolved = await this.resolveAnswer(
          question,
          item.answerId,
          item.answerText,
          item.answerLanguageCode,
        );
        const response = this.buildUserResponse(
          log.userId,
          question,
          resolved,
          persistedLog.id,
          undefined,
        );
        domainResponses.push(response);
        responseEntities.push(this.mapUserResponseToEntity(response));
        await this.upsertPreferredAnswer(log.userId, question.id as string, resolved);
      }

      const persistedResponses = await this.userResponseRepository.bulkCreate(responseEntities);
      persistedResponses.forEach((entity, index) => domainResponses[index].assignId(entity.id));

      return {
        id: persistedLog.id,
        userId: log.userId,
        sessionId: log.sessionId,
        intensity: log.intensity,
        painLocation: log.painLocation,
        startedAt: log.startedAt,
        endedAt: log.endedAt,
        responses: domainResponses.map((response) => this.toOutput(response)),
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };

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

  private async upsertPreferredAnswer(
    userId: string,
    questionId: string,
    resolved: ResolvedAnswer,
  ): Promise<void> {
    const existing = await this.preferredAnswersRepository.findOneBy({
      user: { id: userId },
      question: { id: questionId },
    });
    if (existing !== null) {
      return;
    }
    await this.preferredAnswersRepository.create({
      user: { id: userId },
      question: { id: questionId },
      selection: resolved.selectionId !== null ? { id: resolved.selectionId } : undefined,
      answerText: resolved.answerText,
    });
  }
}
