import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { FindPreferredAnswersByUserUc } from '@/usecase/find-preferred-answers-by-user.uc';
import { UpsertPreferredAnswerUc } from '@/usecase/upsert-preferred-answer.uc';

describe('preferred answers use cases', () => {
  const buildEntity = (id: string) =>
    ({
      id,
      user: { id: 'u-1' },
      question: { id: 'q-1' },
      selection: { id: 's-1' },
      answerText: null,
    }) as never;

  describe('FindPreferredAnswersByUserUc', () => {
    const build = (entities: unknown[]) => {
      const repository = {
        createQueryBuilder: jest.fn(() => ({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getMany: jest.fn(async () => entities),
        })),
      } as unknown as PreferredAnswersRepository;
      return { uc: new FindPreferredAnswersByUserUc(repository), repository };
    };

    it('maps joined entities to output dtos', async () => {
      const { uc } = build([buildEntity('pa-1')]);
      const result = await uc.execute({ userId: 'u-1' });
      expect(result).toEqual([
        { id: 'pa-1', userId: 'u-1', questionId: 'q-1', selectionId: 's-1', answerText: null },
      ]);
    });

    it('requires a non empty userId', async () => {
      const { uc } = build([]);
      await expect(uc.execute({ userId: '' })).rejects.toMatchObject({
        statusCode: 400,
        code: 'DOMAIN_VALIDATION_ERROR',
      });
    });
  });

  describe('UpsertPreferredAnswerUc', () => {
    const build = (existing: unknown) => {
      const repository = {
        createQueryBuilder: jest.fn(() => ({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn(async () => existing),
        })),
        create: jest.fn(async (data: unknown) => ({
          ...(data as Record<string, unknown>),
          id: 'pa-new',
        })),
        update: jest.fn(async () => undefined),
      } as unknown as PreferredAnswersRepository & {
        create: jest.Mock;
        update: jest.Mock;
      };
      return { uc: new UpsertPreferredAnswerUc(repository), repository };
    };

    it('creates a new preferred answer when none exists', async () => {
      const { uc, repository } = build(null);
      const result = await uc.execute({ userId: 'u-1', questionId: 'q-1', selectionId: 's-2' });
      expect(result).toMatchObject({
        id: 'pa-new',
        userId: 'u-1',
        questionId: 'q-1',
        selectionId: 's-2',
      });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ user: { id: 'u-1' }, question: { id: 'q-1' } }),
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('updates the existing row when the pair already exists', async () => {
      const { uc, repository } = build(buildEntity('pa-1'));
      const result = await uc.execute({ userId: 'u-1', questionId: 'q-1', answerText: 'nota' });
      expect(result).toMatchObject({ id: 'pa-1', answerText: 'nota', selectionId: null });
      expect(repository.update).toHaveBeenCalledWith(
        { id: 'pa-1' },
        expect.objectContaining({ answerText: 'nota' }),
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
