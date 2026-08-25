import { DatabaseDataProcessor } from '@/infra/processors/database-data-processor';
import { TerraHealthDataRepository } from '@/infra/database/repository/terra-health-data.repository';
import { TerraUserRepository } from '@/infra/database/repository/terra-user.repository';
import { TerraIngestionPayload } from '@/infra/processors/data-processor.interface';

describe('DatabaseDataProcessor', () => {
  const buildPayload = (): TerraIngestionPayload => ({
    terraUserId: 'terra-1',
    dataType: 'sleep',
    periodStart: new Date('2026-08-01T00:00:00.000Z'),
    periodEnd: new Date('2026-08-01T08:00:00.000Z'),
    receivedAt: new Date('2026-08-01T08:05:00.000Z'),
    data: { score: 80 },
  });

  const buildRepositories = () => ({
    terraUserRepository: {
      findByTerraUserId: jest.fn(),
    } as unknown as jest.Mocked<TerraUserRepository>,
    terraHealthDataRepository: {
      create: jest.fn(),
    } as unknown as jest.Mocked<TerraHealthDataRepository>,
  });

  it('exposes its name and is always enabled', () => {
    const { terraUserRepository, terraHealthDataRepository } = buildRepositories();
    const processor = new DatabaseDataProcessor(terraUserRepository, terraHealthDataRepository);

    expect(processor.getName()).toBe('DatabaseDataProcessor');
    expect(processor.isEnabled()).toBe(true);
  });

  it('resolves the terra user and persists the health data reading', async () => {
    const { terraUserRepository, terraHealthDataRepository } = buildRepositories();
    const terraUser = { id: 'internal-1', terraUserId: 'terra-1' };
    terraUserRepository.findByTerraUserId.mockResolvedValue(terraUser as never);

    const payload = buildPayload();
    await new DatabaseDataProcessor(terraUserRepository, terraHealthDataRepository).process(
      payload,
    );

    expect(terraUserRepository.findByTerraUserId).toHaveBeenCalledWith('terra-1');
    expect(terraHealthDataRepository.create).toHaveBeenCalledWith({
      terraUser,
      dataType: 'sleep',
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      data: payload.data,
    });
  });

  it('throws a DomainError when the terra user is unknown', async () => {
    const { terraUserRepository, terraHealthDataRepository } = buildRepositories();
    terraUserRepository.findByTerraUserId.mockResolvedValue(null);

    await expect(
      new DatabaseDataProcessor(terraUserRepository, terraHealthDataRepository).process(
        buildPayload(),
      ),
    ).rejects.toThrow('Unknown Terra user: terra-1');
    expect(terraHealthDataRepository.create).not.toHaveBeenCalled();
  });
});
