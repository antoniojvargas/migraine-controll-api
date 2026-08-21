import { requireNonEmpty } from '@/domain/validation';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { FormQuestionDto } from '@/dto/form-questionary-output.dto';
import { buildFormQuestionary } from '@/utils/forms-questionary-mapper';

export abstract class FormsQuestionaryBaseUc {
  constructor(
    protected readonly questionRepository: QuestionRepository,
    protected readonly selectionRepository: SelectionRepository,
    protected readonly userResponseRepository: UserResponseRepository,
  ) {}

  protected async loadFormQuestionary(
    categoryPrefix: string,
    input: { userId: string; key?: string },
  ): Promise<FormQuestionDto[]> {
    const userId = requireNonEmpty(input.userId, 'userId');
    const questionQuery = this.questionRepository
      .createQueryBuilder('question')
      .where('question.key LIKE :prefix', { prefix: `${categoryPrefix}%` });
    if (input.key !== undefined) {
      const bareKey = requireNonEmpty(input.key, 'key');
      questionQuery.andWhere('question.key = :fullKey', {
        fullKey: `${categoryPrefix}${bareKey}`,
      });
    }
    const questions = await questionQuery.orderBy('question.order', 'ASC').getMany();
    if (questions.length === 0) {
      return [];
    }

    const questionIds = questions.map((question) => question.id);
    const selections = await this.selectionRepository
      .createQueryBuilder('selection')
      .leftJoinAndSelect('selection.translations', 'translation')
      .where('selection.question_id IN (:...questionIds)', { questionIds })
      .orderBy('selection.order', 'ASC')
      .addOrderBy('translation.language_code', 'ASC')
      .getMany();

    const responses = await this.userResponseRepository.findAllBy({ user: { id: userId } });
    return buildFormQuestionary(questions, selections, responses);
  }
}
