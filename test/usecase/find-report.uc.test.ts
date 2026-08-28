import { FindReportUc } from '@/usecase/find-report.uc';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { NewUserResponseRepository } from '@/infra/database/repository/new-user-response.repository';
import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';
import { createQueryBuilderMock } from './helpers';

const log = (id: string, startedAt: string, intensity: number): Record<string, unknown> => ({
  id,
  user: { id: 'u-1' },
  intensity,
  startedAt: new Date(startedAt),
  endedAt: null,
});

const response = (selectionId: string): Record<string, unknown> => ({
  selection: { id: selectionId },
  value: null,
  answerText: null,
});

const schedule = (treatmentId: string, name: string): Record<string, unknown> => ({
  treatment: { id: treatmentId, name },
});

describe('FindReportUc', () => {
  const build = (): {
    uc: FindReportUc;
    migraineLogRepository: MigraineLogRepository;
    newUserResponseRepository: NewUserResponseRepository;
    scheduleRepository: PreventiveTreatmentScheduleRepository;
  } => {
    const migraineLogRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as MigraineLogRepository;
    const newUserResponseRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as NewUserResponseRepository;
    const scheduleRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as PreventiveTreatmentScheduleRepository;
    return {
      uc: new FindReportUc(migraineLogRepository, newUserResponseRepository, scheduleRepository),
      migraineLogRepository,
      newUserResponseRepository,
      scheduleRepository,
    };
  };

  it('aggregates a full report for the given range', async () => {
    const { uc, migraineLogRepository, newUserResponseRepository, scheduleRepository } = build();
    (migraineLogRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({
        getMany: [
          log('l-1', '2026-06-17T08:00:00.000Z', 40),
          log('l-2', '2026-08-19T08:00:00.000Z', 80),
        ],
      }),
    );
    (newUserResponseRepository.createQueryBuilder as jest.Mock)
      .mockReturnValueOnce(
        createQueryBuilderMock({
          getMany: [response('sel-light'), response('sel-light'), response('sel-noise')],
        }),
      )
      .mockReturnValueOnce(createQueryBuilderMock({ getMany: [response('sel-nausea')] }));
    (scheduleRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getMany: [schedule('t-1', 'Ibuprofen')] }),
    );

    const result = await uc.execute({
      userId: 'u-1',
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-08-31T00:00:00.000Z',
    });

    expect(result.userId).toBe('u-1');
    expect(result.totalMigraines).toBe(2);
    expect(result.intensity).toEqual({ average: 60, min: 40, max: 80 });
    expect(result.duration).toEqual({ averageMinutes: null });
    expect(result.topTriggers).toEqual([
      { selectionId: 'sel-light', answerText: null, count: 2 },
      { selectionId: 'sel-noise', answerText: null, count: 1 },
    ]);
    expect(result.topSymptoms).toEqual([{ selectionId: 'sel-nausea', answerText: null, count: 1 }]);
    expect(result.topTreatments).toEqual([{ treatmentId: 't-1', name: 'Ibuprofen', count: 1 }]);
    expect(result.dayOfWeekDistribution).toHaveLength(7);
    expect(result.intensityDistribution).toEqual([
      { bucketStart: 40, bucketEnd: 49, count: 1 },
      { bucketStart: 80, bucketEnd: 89, count: 1 },
    ]);
    expect(result.monthlyAverage.months).toEqual([
      { month: '2026-06', count: 1 },
      { month: '2026-07', count: 0 },
      { month: '2026-08', count: 1 },
    ]);
  });

  it('returns an empty report when there is no data and no range', async () => {
    const { uc, migraineLogRepository, newUserResponseRepository, scheduleRepository } = build();
    (migraineLogRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getMany: [] }),
    );
    (newUserResponseRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getMany: [] }),
    );
    (scheduleRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getMany: [] }),
    );

    const result = await uc.execute({ userId: 'u-1' });

    expect(result.totalMigraines).toBe(0);
    expect(result.intensity).toEqual({ average: null, min: null, max: null });
    expect(result.topTriggers).toEqual([]);
    expect(result.topSymptoms).toEqual([]);
    expect(result.topTreatments).toEqual([]);
    expect(result.monthlyAverage).toEqual({ averagePerMonth: 0, months: [] });
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

  it('rejects a missing userId', async () => {
    const { uc } = build();

    await expect(uc.execute({ userId: '' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
