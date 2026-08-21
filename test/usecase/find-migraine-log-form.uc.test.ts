import { FindMigraineLogFormUc } from '@/usecase/find-migraine-log-form.uc';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';

describe('FindMigraineLogFormUc', () => {
  const build = (questionsResult: unknown) => {
    const questionQuery = {
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(questionsResult),
    };
    const selectionQuery = { ...questionQuery, getMany: jest.fn().mockResolvedValue([]) };
    const userResponseRepository = {
      findAllBy: jest.fn().mockResolvedValue([]),
    } as unknown as UserResponseRepository;
    const uc = new FindMigraineLogFormUc(
      {
        createQueryBuilder: jest.fn().mockReturnValue(questionQuery),
      } as unknown as QuestionRepository,
      {
        createQueryBuilder: jest.fn().mockReturnValue(selectionQuery),
      } as unknown as SelectionRepository,
      userResponseRepository,
    );
    return { uc, questionQuery };
  };

  it('returns the single migraine_log form matching the prefixed key', async () => {
    const { uc, questionQuery } = build([
      { id: 'q-9', key: 'migraine_log@pain', type: 'single', order: 3 },
    ]);

    const result = await uc.execute({ userId: 'u-2', key: 'pain' });

    expect(questionQuery.where).toHaveBeenCalledWith('question.key LIKE :prefix', {
      prefix: 'migraine_log@%',
    });
    expect(questionQuery.andWhere).toHaveBeenCalledWith('question.key = :fullKey', {
      fullKey: 'migraine_log@pain',
    });
    expect(result).toMatchObject({ id: 'q-9', key: 'migraine_log@pain' });
  });

  it('returns null when the form does not exist', async () => {
    const { uc } = build([]);

    const result = await uc.execute({ userId: 'u-2', key: 'missing' });

    expect(result).toBeNull();
  });
});
