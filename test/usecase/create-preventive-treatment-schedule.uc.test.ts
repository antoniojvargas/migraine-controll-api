import { CreatePreventiveTreatmentScheduleUc } from '@/usecase/create-preventive-treatment-schedule.uc';
import { PreventiveTreatmentRepository } from '@/infra/database/repository/preventive-treatment.repository';
import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';

interface Mocks {
  uc: CreatePreventiveTreatmentScheduleUc;
  preventiveTreatmentRepository: PreventiveTreatmentRepository;
  scheduleRepository: PreventiveTreatmentScheduleRepository;
}

describe('CreatePreventiveTreatmentScheduleUc', () => {
  const build = (): Mocks => {
    const preventiveTreatmentRepository = {
      findOneBy: jest.fn(),
    } as unknown as PreventiveTreatmentRepository;
    const scheduleRepository = {
      bulkCreate: jest.fn(),
    } as unknown as PreventiveTreatmentScheduleRepository;
    return {
      uc: new CreatePreventiveTreatmentScheduleUc(
        preventiveTreatmentRepository,
        scheduleRepository,
      ),
      preventiveTreatmentRepository,
      scheduleRepository,
    };
  };

  const echoBulk = (scheduleRepository: PreventiveTreatmentScheduleRepository): void => {
    (scheduleRepository.bulkCreate as jest.Mock).mockImplementation(async (data: unknown) =>
      (data as Array<Record<string, unknown>>).map((item, index) => ({
        id: `sc-${index + 1}`,
        scheduledAt: item.scheduledAt as Date,
        reminderBeforeLog: item.reminderBeforeLog as number,
      })),
    );
  };

  it('generates weekly occurrences for a recurrent treatment up to repeatUntil', async () => {
    const { uc, preventiveTreatmentRepository, scheduleRepository } = build();
    (preventiveTreatmentRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 't-1',
      isRecurrent: true,
      repeatUntil: new Date('2026-09-10T00:00:00.000Z'),
    });
    echoBulk(scheduleRepository);

    const result = await uc.execute({
      preventiveTreatmentId: 't-1',
      scheduledAt: new Date('2026-08-18T08:00:00.000Z'),
      recurrence: 'Week',
      reminderBeforeLog: 60,
    });

    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({ preventiveTreatmentId: 't-1', reminderBeforeLog: 60 });
    expect(result[3].scheduledAt.toISOString()).toBe('2026-09-08T08:00:00.000Z');
    expect(scheduleRepository.bulkCreate).toHaveBeenCalledTimes(1);
  });

  it('defaults reminderBeforeLog to 0', async () => {
    const { uc, preventiveTreatmentRepository, scheduleRepository } = build();
    (preventiveTreatmentRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 't-1',
      isRecurrent: false,
      repeatUntil: null,
    });
    echoBulk(scheduleRepository);

    const result = await uc.execute({
      preventiveTreatmentId: 't-1',
      scheduledAt: new Date('2026-08-18T08:00:00.000Z'),
      recurrence: 'Day',
    });

    expect(result).toHaveLength(1);
    expect(result[0].reminderBeforeLog).toBe(0);
  });

  it('creates a single schedule for non-recurrent treatments', async () => {
    const { uc, preventiveTreatmentRepository, scheduleRepository } = build();
    (preventiveTreatmentRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 't-1',
      isRecurrent: false,
      repeatUntil: null,
    });
    echoBulk(scheduleRepository);

    const result = await uc.execute({
      preventiveTreatmentId: 't-1',
      scheduledAt: new Date('2026-08-18T08:00:00.000Z'),
      recurrence: 'Week',
      reminderBeforeLog: 15,
    });

    expect(result).toHaveLength(1);
    expect(result[0].reminderBeforeLog).toBe(15);
  });

  it('uses a one-year horizon when recurrent without repeatUntil', async () => {
    const { uc, preventiveTreatmentRepository, scheduleRepository } = build();
    (preventiveTreatmentRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 't-1',
      isRecurrent: true,
      repeatUntil: null,
    });
    echoBulk(scheduleRepository);

    const result = await uc.execute({
      preventiveTreatmentId: 't-1',
      scheduledAt: new Date('2026-08-18T08:00:00.000Z'),
      recurrence: 'Year',
    });

    expect(result).toHaveLength(2);
  });

  it('throws 404 when the treatment does not exist', async () => {
    const { uc, preventiveTreatmentRepository } = build();
    (preventiveTreatmentRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    await expect(
      uc.execute({
        preventiveTreatmentId: 'nope',
        scheduledAt: new Date(),
        recurrence: 'Day',
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'PREVENTIVE_TREATMENT_NOT_FOUND' });
  });

  it('rejects an invalid recurrence', async () => {
    const { uc } = build();

    await expect(
      uc.execute({
        preventiveTreatmentId: 't-1',
        scheduledAt: new Date(),
        recurrence: 'Hour' as never,
      }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
  });

  it('rejects a negative reminderBeforeLog', async () => {
    const { uc } = build();

    await expect(
      uc.execute({
        preventiveTreatmentId: 't-1',
        scheduledAt: new Date(),
        recurrence: 'Day',
        reminderBeforeLog: -1,
      }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
  });
});
