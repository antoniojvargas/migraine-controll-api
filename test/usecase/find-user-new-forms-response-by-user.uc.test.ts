import { FindUserNewFormsResponseByUserUc } from '@/usecase/find-user-new-forms-response-by-user.uc';
import { NewUserResponseRepository } from '@/infra/database/repository/new-user-response.repository';

describe('FindUserNewFormsResponseByUserUc', () => {
  const build = () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    const userResponseRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as NewUserResponseRepository;
    const uc = new FindUserNewFormsResponseByUserUc(userResponseRepository);
    return {
      uc,
      userResponseRepository,
      queryBuilder: queryBuilder as unknown as Record<string, jest.Mock>,
    };
  };

  it('returns the responses of the user mapped with relation ids', async () => {
    const { uc, queryBuilder } = build();
    queryBuilder.getMany.mockResolvedValue([
      {
        id: 'r-1',
        user: { id: 'u-1' },
        question: { id: 'q-1' },
        selection: { id: 'custom-sel', value: 'Calor' },
        value: null,
        isCustom: true,
        answerText: null,
        migraineLog: { id: 'ml-1' },
        preventiveTreatment: null,
      },
      {
        id: 'r-2',
        user: { id: 'u-1' },
        question: { id: 'q-text' },
        selection: null,
        value: null,
        isCustom: false,
        answerText: 'Nota',
        migraineLog: null,
        preventiveTreatment: null,
      },
    ]);

    const result = await uc.execute({ userId: 'u-1' });

    expect(queryBuilder.where).toHaveBeenCalledWith('user_response.user_id = :userId', {
      userId: 'u-1',
    });
    expect(result).toEqual([
      {
        id: 'r-1',
        userId: 'u-1',
        questionId: 'q-1',
        selectionId: 'custom-sel',
        value: null,
        isCustom: true,
        answerText: null,
        migraineLogId: 'ml-1',
        preventiveTreatmentId: null,
      },
      {
        id: 'r-2',
        userId: 'u-1',
        questionId: 'q-text',
        selectionId: null,
        value: null,
        isCustom: false,
        answerText: 'Nota',
        migraineLogId: null,
        preventiveTreatmentId: null,
      },
    ]);
  });

  it('returns an empty array when the user has no responses', async () => {
    const { uc, queryBuilder } = build();
    queryBuilder.getMany.mockResolvedValue([]);

    const result = await uc.execute({ userId: 'u-1' });

    expect(result).toEqual([]);
  });
});
