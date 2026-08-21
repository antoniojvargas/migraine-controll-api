import { DataSource, EntityManager } from 'typeorm';
import { CreateUserResponsesNewFormsUc } from '@/usecase/create-user-responses-new-forms.uc';
import {
  NewQuestionEntity,
  NewSelectionEntity,
  NewUserResponseEntity,
} from '@/infra/database/entities';

interface Mocks {
  uc: CreateUserResponsesNewFormsUc;
  userResponseRepository: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    findOneBy: jest.Mock;
    findBy: jest.Mock;
  };
  questionRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    findBy: jest.Mock;
  };
  selectionRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    findBy: jest.Mock;
  };
}

describe('CreateUserResponsesNewFormsUc', () => {
  const build = (): Mocks => {
    const userResponseRepository = {
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) =>
        Array.isArray(data)
          ? data.map((entity, index) => ({ ...(entity as object), id: `r-${index + 1}` }))
          : { ...(data as object), id: 'r-single' },
      ),
      delete: jest.fn(),
      findOneBy: jest.fn(),
      findBy: jest.fn(),
    };
    const questionRepository = {
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
      findOneBy: jest.fn(),
      findBy: jest.fn(),
    };
    questionRepository.findOneBy.mockResolvedValue({
      id: 'q-1',
      key: 'aura',
      type: 'single',
      order: 1,
    });
    const selectionRepository = {
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => ({ ...(data as object), id: 'custom-sel' })),
      findOneBy: jest.fn(),
      findBy: jest.fn(),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === NewUserResponseEntity) return userResponseRepository;
        if (entity === NewQuestionEntity) return questionRepository;
        if (entity === NewSelectionEntity) return selectionRepository;
        throw new Error(`unexpected entity ${String(entity)}`);
      }),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn(async (cb: (manager: EntityManager) => Promise<unknown>) => cb(manager)),
    } as unknown as DataSource;
    const uc = new CreateUserResponsesNewFormsUc(dataSource);
    return { uc, userResponseRepository, questionRepository, selectionRepository };
  };

  it('deletes previous responses and replaces them in batch inside one transaction', async () => {
    const { uc, userResponseRepository, questionRepository } = build();
    questionRepository.findOneBy.mockResolvedValue({
      id: 'q-1',
      key: 'aura',
      type: 'single',
      order: 1,
    });

    const result = await uc.execute({
      userId: 'u-1',
      migraineLogId: 'ml-1',
      responses: [
        { questionId: 'q-1', answerId: 'sel-1' },
        { questionId: 'q-1', answerId: 'sel-2' },
      ],
    });

    expect(userResponseRepository.delete).toHaveBeenCalledWith({ user: { id: 'u-1' } });
    expect(userResponseRepository.delete.mock.invocationCallOrder[0]).toBeLessThan(
      userResponseRepository.save.mock.invocationCallOrder[0],
    );
    expect(userResponseRepository.save).toHaveBeenCalledTimes(1);
    const entities = userResponseRepository.save.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(2);
    expect(entities[0]).toMatchObject({
      user: { id: 'u-1' },
      question: { id: 'q-1' },
      selection: { id: 'sel-1' },
      value: null,
      isCustom: false,
      migraineLog: { id: 'ml-1' },
    });
    expect(questionRepository.findOneBy).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'r-1',
      userId: 'u-1',
      questionId: 'q-1',
      selectionId: 'sel-1',
      migraineLogId: 'ml-1',
    });
    expect(result[1].selectionId).toBe('sel-2');
  });

  it('stores free-text choice answers as custom selections with value and no translation row', async () => {
    const { uc, userResponseRepository, selectionRepository } = build();
    selectionRepository.findBy.mockResolvedValue([{ order: 3 }]);

    const result = await uc.execute({
      userId: 'u-1',
      responses: [{ questionId: 'q-1', answerText: 'Calor' }],
    });

    expect(selectionRepository.create).toHaveBeenCalledWith({
      question: { id: 'q-1' },
      key: expect.stringMatching(/^other-/),
      order: 4,
      value: 'Calor',
      isCustom: true,
    });
    const entities = userResponseRepository.save.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(entities[0]).toMatchObject({
      selection: { id: 'custom-sel' },
      value: null,
      isCustom: true,
      answerText: null,
    });
    expect(result[0].selectionId).toBe('custom-sel');
  });

  it('stores text question answers in answer_text without selection', async () => {
    const { uc, userResponseRepository, questionRepository } = build();
    questionRepository.findOneBy.mockResolvedValue({
      id: 'q-text',
      key: 'notes',
      type: 'text',
      order: 9,
    });

    await uc.execute({
      userId: 'u-1',
      responses: [{ questionId: 'q-text', answerText: 'Nota libre' }],
    });

    const entities = userResponseRepository.save.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(entities[0]).toMatchObject({
      question: { id: 'q-text' },
      selection: undefined,
      answerText: 'Nota libre',
      value: null,
      isCustom: false,
    });
  });

  it('rolls back when any response references a missing question', async () => {
    const { uc, questionRepository } = build();
    questionRepository.findOneBy
      .mockResolvedValueOnce({ id: 'q-1', key: 'aura', type: 'single', order: 1 })
      .mockResolvedValueOnce(null);

    await expect(
      uc.execute({
        userId: 'u-1',
        responses: [
          { questionId: 'q-1', answerId: 'sel-1' },
          { questionId: 'missing', answerId: 'sel-2' },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'QUESTION_NOT_FOUND' });
  });
});
