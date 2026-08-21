import { FindMigraineLogFormsUc } from '@/usecase/find-migraine-log-forms.uc';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';

describe('FindMigraineLogFormsUc', () => {
  const build = (
    questionsResult: unknown,
    selectionsResult: unknown,
    responsesResult: unknown = [],
  ) => {
    const questionQuery = {
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(questionsResult),
    };
    const selectionQuery = {
      ...questionQuery,
      getMany: jest.fn().mockResolvedValue(selectionsResult),
    };
    const userResponseRepository = {
      findAllBy: jest.fn().mockResolvedValue(responsesResult),
    } as unknown as UserResponseRepository;
    const uc = new FindMigraineLogFormsUc(
      {
        createQueryBuilder: jest.fn().mockReturnValue(questionQuery),
      } as unknown as QuestionRepository,
      {
        createQueryBuilder: jest.fn().mockReturnValue(selectionQuery),
      } as unknown as SelectionRepository,
      userResponseRepository,
    );
    return { uc, questionQuery, userResponseRepository };
  };

  it('builds forms for the migraine_log@ category', async () => {
    const { uc, questionQuery } = build(
      [{ id: 'q-9', key: 'migraine_log@intensity', type: 'scale', order: 1 }],
      [
        {
          id: 'sel-9',
          key: 'mild',
          order: 1,
          question: { id: 'q-9' },
          translations: [{ languageCode: 'en', text: 'Mild' }],
        },
      ],
    );

    const result = await uc.execute({ userId: 'u-2' });

    expect(questionQuery.where).toHaveBeenCalledWith('question.key LIKE :prefix', {
      prefix: 'migraine_log@%',
    });
    expect(result).toEqual([
      {
        id: 'q-9',
        key: 'migraine_log@intensity',
        type: 'scale',
        order: 1,
        value: null,
        selections: [
          {
            id: 'sel-9',
            key: 'mild',
            order: 1,
            isSelected: false,
            translations: [{ languageCode: 'en', text: 'Mild' }],
          },
        ],
      },
    ]);
  });

  it('marks selections previously chosen by the user', async () => {
    const { uc } = build(
      [{ id: 'q-9', key: 'migraine_log@intensity', type: 'scale', order: 1 }],
      [
        {
          id: 'sel-9',
          key: 'mild',
          order: 1,
          question: { id: 'q-9' },
          translations: [],
        },
      ],
      [{ selection: { id: 'sel-9' }, answerText: null, question: undefined }],
    );

    const result = await uc.execute({ userId: 'u-2' });

    expect(result[0].selections[0].isSelected).toBe(true);
  });
});
