import { MIGRAINE_LOG_CATEGORY_PREFIX } from '@/domain/constants';
import { FindFormsInputDto } from '@/dto/find-forms-input.dto';
import { FormQuestionDto } from '@/dto/form-questionary-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { FormsQuestionaryBaseUc } from './forms-questionary-base.uc';

export class FindMigraineLogFormsUc
  extends FormsQuestionaryBaseUc
  implements UseCaseInterface<FindFormsInputDto, FormQuestionDto[]>
{
  execute = async (input: FindFormsInputDto): Promise<FormQuestionDto[]> => {
    try {
      return await this.loadFormQuestionary(MIGRAINE_LOG_CATEGORY_PREFIX, input);
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
