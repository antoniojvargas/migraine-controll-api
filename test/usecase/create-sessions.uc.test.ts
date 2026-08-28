import { CreateSessionsUc } from '@/usecase/create-sessions.uc';
import { SessionRepository } from '@/infra/database/repository/session.repository';

const session = (deviceId: string): Record<string, unknown> => ({
  deviceId,
  progSelected: 'p1',
  duration: 30,
  maxIntensity: 50,
  batteryLevel: 80,
});

describe('CreateSessionsUc', () => {
  const build = (): { uc: CreateSessionsUc; sessionRepository: SessionRepository } => {
    const sessionRepository = { bulkCreate: jest.fn() } as unknown as SessionRepository;
    return { uc: new CreateSessionsUc(sessionRepository), sessionRepository };
  };

  it('bulk creates sessions and returns them in order', async () => {
    const { uc, sessionRepository } = build();
    (sessionRepository.bulkCreate as jest.Mock).mockResolvedValue([{ id: 'se-1' }, { id: 'se-2' }]);

    const result = await uc.execute({ sessions: [session('d-1'), session('d-2')] });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'se-1', deviceId: 'd-1' });
    expect(result[1]).toMatchObject({ id: 'se-2', deviceId: 'd-2' });
    expect(sessionRepository.bulkCreate).toHaveBeenCalledWith([
      expect.objectContaining({ device: { id: 'd-1' } }),
      expect.objectContaining({ device: { id: 'd-2' } }),
    ]);
  });

  it('rejects when any session in the batch is invalid', async () => {
    const { uc } = build();

    await expect(
      uc.execute({ sessions: [session('d-1'), { ...session('d-2'), duration: 999 }] }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
  });
});
