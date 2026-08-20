import { DeepPartial } from 'typeorm';
import { PreventiveTreatment } from '@/domain/preventive-treatment';
import { Question } from '@/domain/question';
import { UserResponse } from '@/domain/user-response';
import { PreventiveTreatmentRepository } from '@/infra/database/repository/preventive-treatment.repository';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { PreventiveTreatmentEntity, UserResponseEntity } from '@/infra/database/entities';
import { CreatePreventiveTreatmentInputDto } from '@/dto/create-preventive-treatment-input.dto';
import { PreventiveTreatmentOutputDto } from '@/dto/preventive-treatment-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { UserResponseBaseUc, ResolvedAnswer } from './user-response-base.uc';

export class CreatePreventiveTreatmentUc
  extends UserResponseBaseUc
  implements UseCaseInterface<CreatePreventiveTreatmentInputDto, PreventiveTreatmentOutputDto>
{
  private readonly preventiveTreatmentRepository: PreventiveTreatmentRepository;
  private readonly preferredAnswersRepository: PreferredAnswersRepository;

  constructor(
    preventiveTreatmentRepository: PreventiveTreatmentRepository,
    preferredAnswersRepository: PreferredAnswersRepository,
    userResponseRepository: UserResponseRepository,
    questionRepository: QuestionRepository,
    selectionRepository: SelectionRepository,
    translationRepository: TranslationRepository,
  ) {
    super(userResponseRepository, questionRepository, selectionRepository, translationRepository);
    this.preventiveTreatmentRepository = preventiveTreatmentRepository;
    this.preferredAnswersRepository = preferredAnswersRepository;
  }

  execute = async (
    input: CreatePreventiveTreatmentInputDto,
  ): Promise<PreventiveTreatmentOutputDto> => {
    try {
      const { responses = [], ...treatmentDto } = input;
      const treatment = PreventiveTreatment.createNewPreventiveTreatment(treatmentDto);
      const persistedTreatment = await this.preventiveTreatmentRepository.create(
        this.mapTreatmentToEntity(treatment),
      );
      treatment.assignId(persistedTreatment.id);

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
          treatment.userId,
          question,
          resolved,
          undefined,
          persistedTreatment.id,
        );
        domainResponses.push(response);
        responseEntities.push(this.mapUserResponseToEntity(response));
        await this.upsertPreferredAnswer(treatment.userId, question.id as string, resolved);
      }

      const persistedResponses = await this.userResponseRepository.bulkCreate(responseEntities);
      persistedResponses.forEach((entity, index) => domainResponses[index].assignId(entity.id));

      return {
        id: persistedTreatment.id,
        userId: treatment.userId,
        name: treatment.name,
        isRecurrent: treatment.isRecurrent,
        repeatUntil: treatment.repeatUntil,
        responses: domainResponses.map((response) => this.toOutput(response)),
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private mapTreatmentToEntity(
    treatment: PreventiveTreatment,
  ): DeepPartial<PreventiveTreatmentEntity> {
    return {
      user: { id: treatment.userId },
      name: treatment.name,
      isRecurrent: treatment.isRecurrent,
      repeatUntil: treatment.repeatUntil,
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
