import { DeepPartial } from 'typeorm';
import { PreventiveTreatment } from '@/domain/preventive-treatment';
import { PreventiveTreatmentRepository } from '@/infra/database/repository/preventive-treatment.repository';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { PreventiveTreatmentEntity } from '@/infra/database/entities';
import { CreatePreventiveTreatmentInputDto } from '@/dto/create-preventive-treatment-input.dto';
import { PreventiveTreatmentOutputDto } from '@/dto/preventive-treatment-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { UserResponseBaseUc } from './user-response-base.uc';

export class CreatePreventiveTreatmentUc
  extends UserResponseBaseUc
  implements UseCaseInterface<CreatePreventiveTreatmentInputDto, PreventiveTreatmentOutputDto>
{
  private readonly preventiveTreatmentRepository: PreventiveTreatmentRepository;

  constructor(
    preventiveTreatmentRepository: PreventiveTreatmentRepository,
    preferredAnswersRepository: PreferredAnswersRepository,
    userResponseRepository: UserResponseRepository,
    questionRepository: QuestionRepository,
    selectionRepository: SelectionRepository,
    translationRepository: TranslationRepository,
  ) {
    super(
      userResponseRepository,
      questionRepository,
      selectionRepository,
      translationRepository,
      preferredAnswersRepository,
    );
    this.preventiveTreatmentRepository = preventiveTreatmentRepository;
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

      const domainResponses = await this.persistUserResponses({
        userId: treatment.userId,
        items: responses,
        preventiveTreatmentId: persistedTreatment.id,
        upsertPreferred: true,
      });

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
}
