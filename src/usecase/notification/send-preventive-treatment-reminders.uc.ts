import { PreventiveTreatmentScheduleEntity } from '@/infra/database/entities';
import { PreventiveTreatmentScheduleMetadataRepository } from '@/infra/database/repository/preventive-treatment-schedule-metadata.repository';
import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';
import { UseCaseInterface } from '@/usecase/usecase.interface';
import { notifyUsers } from './notificationHelpers';

export interface SendPreventiveTreatmentRemindersOutput {
  remindersSent: number;
}

export class SendPreventiveTreatmentRemindersUc implements UseCaseInterface<
  void,
  SendPreventiveTreatmentRemindersOutput
> {
  constructor(
    private readonly preventiveTreatmentScheduleRepository: PreventiveTreatmentScheduleRepository,
    private readonly preventiveTreatmentScheduleMetadataRepository: PreventiveTreatmentScheduleMetadataRepository,
    private readonly pushNotificationTokenRepository: PushNotificationTokenRepository,
  ) {}

  execute = async (): Promise<SendPreventiveTreatmentRemindersOutput> => {
    const dueSchedules = await this.findDueSchedules();

    await Promise.all(
      dueSchedules.map(async (schedule) => {
        const tokens = await this.pushNotificationTokenRepository.findAllBy({
          user: { id: schedule.treatment.user.id },
        });

        await notifyUsers([{ userId: schedule.treatment.user.id, tokens }], {
          title: 'Preventive treatment reminder',
          body: `It's time for your preventive treatment: ${schedule.treatment.name}`,
          data: { scheduleId: schedule.id },
        });

        await this.markAsReminded(schedule.id);
      }),
    );

    return { remindersSent: dueSchedules.length };
  };

  private findDueSchedules = async (): Promise<PreventiveTreatmentScheduleEntity[]> => {
    return this.preventiveTreatmentScheduleRepository
      .createQueryBuilder('schedule')
      .innerJoinAndSelect('schedule.treatment', 'treatment')
      .innerJoinAndSelect('treatment.user', 'user')
      .leftJoin(
        'preventive_treatment_schedule_metadata',
        'metadata',
        'metadata.preventive_treatment_schedule_id = schedule.id',
      )
      .where('schedule.reminder_before_log IS NOT NULL')
      .andWhere(
        "schedule.scheduled_at - (schedule.reminder_before_log * INTERVAL '1 minute') <= NOW()",
      )
      .andWhere('metadata.reminded_at IS NULL')
      .getMany();
  };

  private markAsReminded = async (scheduleId: string): Promise<void> => {
    const metadata = await this.preventiveTreatmentScheduleMetadataRepository.findOneBy({
      schedule: { id: scheduleId },
    });

    if (metadata === null) {
      await this.preventiveTreatmentScheduleMetadataRepository.create({
        schedule: { id: scheduleId },
        remindedAt: new Date(),
      });
      return;
    }

    await this.preventiveTreatmentScheduleMetadataRepository.update(
      { id: metadata.id },
      { remindedAt: new Date() },
    );
  };
}
