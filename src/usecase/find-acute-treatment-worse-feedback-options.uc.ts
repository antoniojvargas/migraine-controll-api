import { AcuteTreatmentWorseFeedbackOptionOutputDto } from '@/dto/acute-treatment-worse-feedback-option-output.dto';
import { AcuteTreatmentWorseFeedbackOptionsRepository } from '@/infra/database/repository/acute-treatment-worse-feedback-options.repository';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindAcuteTreatmentWorseFeedbackOptionsUc implements UseCaseInterface<
  void,
  AcuteTreatmentWorseFeedbackOptionOutputDto[]
> {
  constructor(
    private readonly feedbackOptionsRepository: AcuteTreatmentWorseFeedbackOptionsRepository,
  ) {}

  execute = async (): Promise<AcuteTreatmentWorseFeedbackOptionOutputDto[]> => {
    try {
      const entities = await this.feedbackOptionsRepository.findAllBy({});
      return entities.map((entity) => ({
        id: entity.id,
        key: entity.key,
        text: entity.text,
      }));
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
