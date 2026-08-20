import { FindMigraineLogsUc } from '@/usecase/find-migraine-logs.uc';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';
import { createQueryBuilderMock } from './helpers';

const log = (id: string, startedAt: string, intensity: number): Record<string, unknown> => ({
  id,
  user: { id: 'u-1' },
  session: null,
  intensity,
  painLocation: 'frontal',
  startedAt: new Date(startedAt),
  endedAt: null,
});

describe('FindMigraineLogsUc', () => {
  const build = (): {
    uc: FindMigraineLogsUc;
    migraineLogRepository: MigraineLogRepository;
    scheduleRepository: PreventiveTreatmentScheduleRepository;
  } => {
    const migraineLogRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as MigraineLogRepository;
    const scheduleRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as PreventiveTreatmentScheduleRepository;
    return {
      uc: new FindMigraineLogsUc(migraineLogRepository, scheduleRepository),
      migraineLogRepository,
      scheduleRepository,
    };
  };

  it('returns logs and sun-sat weekly statistics for the range', async () => {
    const { uc, migraineLogRepository, scheduleRepository } = build();
    (migraineLogRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({
        getMany: [
          log('l-1', '2026-08-17T08:00:00.000Z', 40),
          log('l-2', '2026-08-19T08:00:00.000Z', 60),
        ],
      }),
    );
    (scheduleRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({
        getMany: [{ id: 's-1', scheduledAt: new Date('2026-08-18T08:00:00.000Z') }],
      }),
    );

    const result = await uc.execute({
      userId: 'u-1',
      from: '2026-08-12T00:00:00.000Z',
      to: '2026-08-31T00:00:00.000Z',
    });

    expect(result.logs).toHaveLength(2);
    expect(result.logs[0]).toMatchObject({ id: 'l-1', userId: 'u-1' });
    expect(result.weeks).toEqual([
      { weekStart: '2026-08-09', migraineCount: 0, averageIntensity: null, treatmentCount: 0 },
      { weekStart: '2026-08-16', migraineCount: 2, averageIntensity: 50, treatmentCount: 1 },
      { weekStart: '2026-08-23', migraineCount: 0, averageIntensity: null, treatmentCount: 0 },
      { weekStart: '2026-08-30', migraineCount: 0, averageIntensity: null, treatmentCount: 0 },
    ]);
  });

  it('returns logs without a range', async () => {
    const { uc, migraineLogRepository, scheduleRepository } = build();
    (migraineLogRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getMany: [log('l-1', '2026-08-17T08:00:00.000Z', 40)] }),
    );
    (scheduleRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getMany: [] }),
    );

    const result = await uc.execute({ userId: 'u-1' });

    expect(result.logs).toHaveLength(1);
    expect(result.weeks).toEqual([
      { weekStart: '2026-08-16', migraineCount: 1, averageIntensity: 40, treatmentCount: 0 },
    ]);
  });

  it('rejects from after to', async () => {
    const { uc } = build();

    await expect(
      uc.execute({
        userId: 'u-1',
        from: '2026-08-31T00:00:00.000Z',
        to: '2026-08-12T00:00:00.000Z',
      }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
  });
});
