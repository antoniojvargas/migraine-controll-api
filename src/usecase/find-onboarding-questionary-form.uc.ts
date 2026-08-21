import { FORMS_CATEGORY_PREFIX } from '@/domain/constants';
import { FindFormInputDto } from '@/dto/find-forms-input.dto';
import { FormQuestionDto } from '@/dto/form-questionary-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { FormsQuestionaryBaseUc } from './forms-questionary-base.uc';

export class FindOnboardingQuestionaryFormUc
  extends FormsQuestionaryBaseUc
  implements UseCaseInterface<FindFormInputDto, FormQuestionDto | null>
{
  execute = async (input: FindFormInputDto): Promise<FormQuestionDto | null> => {
    try {
      const forms = await this.loadFormQuestionary(FORMS_CATEGORY_PREFIX, input);
      return forms[0] ?? null;
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}
