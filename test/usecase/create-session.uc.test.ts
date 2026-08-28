import { CreateSessionUc } from '@/usecase/create-session.uc';
import { SessionRepository } from '@/infra/database/repository/session.repository';

const baseInput = {
  deviceId: 'd-1',
  progSelected: 'p1',
  duration: 30,
  maxIntensity: 50,
  batteryLevel: 80,
};

describe('CreateSessionUc', () => {
  const build = (): { uc: CreateSessionUc; sessionRepository: SessionRepository } => {
    const sessionRepository = { create: jest.fn() } as unknown as SessionRepository;
    return { uc: new CreateSessionUc(sessionRepository), sessionRepository };
  };

  it('creates a session and returns the output', async () => {
    const { uc, sessionRepository } = build();
    (sessionRepository.create as jest.Mock).mockResolvedValue({ id: 'se-1' });

    const result = await uc.execute(baseInput);

    expect(result).toMatchObject({
      id: 'se-1',
      deviceId: 'd-1',
      progSelected: 'p1',
      duration: 30,
      maxIntensity: 50,
      batteryLevel: 80,
    });
    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ device: { id: 'd-1' }, progSelected: 'p1', duration: 30 }),
    );
  });

  it('rejects a duration above the program limit with 400', async () => {
    const { uc } = build();

    await expect(uc.execute({ ...baseInput, duration: 999 })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
