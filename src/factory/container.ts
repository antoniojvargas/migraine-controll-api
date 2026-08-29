import { DataSource } from 'typeorm';
import {
  AcuteTreatmentWorseFeedbackOptionsEntity,
  AppVersionEntity,
  DeviceEntity,
  MigraineLogEntity,
  NewQuestionEntity,
  NewSelectionEntity,
  NewTranslationEntity,
  NewUserResponseEntity,
  PreferredAnswersEntity,
  PreventiveTreatmentEntity,
  PreventiveTreatmentScheduleEntity,
  PreventiveTreatmentScheduleMetadataEntity,
  ProfileEntity,
  PushNotificationTokenEntity,
  QuestionEntity,
  SelectionEntity,
  SessionEntity,
  TerraHealthDataEntity,
  TerraUserEntity,
  TerraWebhookLogEntity,
  TranslationEntity,
  UserDailyVitalsEntity,
  UserEntity,
  UserResponseEntity,
  WeatherTileEntity,
} from '@/infra/database/entities';
import { AcuteTreatmentWorseFeedbackOptionsRepository } from '@/infra/database/repository/acute-treatment-worse-feedback-options.repository';
import { AppVersionRepository } from '@/infra/database/repository/app-version.repository';
import { DeviceRepository } from '@/infra/database/repository/device.repository';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { NewQuestionRepository } from '@/infra/database/repository/new-question.repository';
import { NewSelectionRepository } from '@/infra/database/repository/new-selection.repository';
import { NewTranslationRepository } from '@/infra/database/repository/new-translation.repository';
import { NewUserResponseRepository } from '@/infra/database/repository/new-user-response.repository';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { PreventiveTreatmentRepository } from '@/infra/database/repository/preventive-treatment.repository';
import { PreventiveTreatmentScheduleMetadataRepository } from '@/infra/database/repository/preventive-treatment-schedule-metadata.repository';
import { PreventiveTreatmentScheduleRepository } from '@/infra/database/repository/preventive-treatment-schedule.repository';
import { ProfileRepository } from '@/infra/database/repository/profile.repository';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { SessionRepository } from '@/infra/database/repository/session.repository';
import { TerraHealthDataRepository } from '@/infra/database/repository/terra-health-data.repository';
import { TerraUserRepository } from '@/infra/database/repository/terra-user.repository';
import { TerraWebhookLogRepository } from '@/infra/database/repository/terra-webhook-log.repository';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { UserDailyVitalsRepository } from '@/infra/database/repository/user-daily-vitals.repository';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { WeatherTileRepository } from '@/infra/database/repository/weather-tile.repository';

/**
 * Punto único de ensamblado de repositorios. Todos los entrypoints (HTTP en
 * `build-app.ts`, Lambdas de cron/cola y triggers de Cognito) construyen sus
 * repositorios a través de aquí en vez de repetir
 * `new XRepository(dataSource.getRepository(XEntity))` en cada archivo.
 */
export interface Repositories {
  acuteTreatmentWorseFeedbackOptions: AcuteTreatmentWorseFeedbackOptionsRepository;
  appVersion: AppVersionRepository;
  device: DeviceRepository;
  migraineLog: MigraineLogRepository;
  newQuestion: NewQuestionRepository;
  newSelection: NewSelectionRepository;
  newTranslation: NewTranslationRepository;
  newUserResponse: NewUserResponseRepository;
  preferredAnswers: PreferredAnswersRepository;
  preventiveTreatment: PreventiveTreatmentRepository;
  preventiveTreatmentSchedule: PreventiveTreatmentScheduleRepository;
  preventiveTreatmentScheduleMetadata: PreventiveTreatmentScheduleMetadataRepository;
  profile: ProfileRepository;
  pushNotificationToken: PushNotificationTokenRepository;
  question: QuestionRepository;
  selection: SelectionRepository;
  session: SessionRepository;
  terraHealthData: TerraHealthDataRepository;
  terraUser: TerraUserRepository;
  terraWebhookLog: TerraWebhookLogRepository;
  translation: TranslationRepository;
  user: UserRepository;
  userDailyVitals: UserDailyVitalsRepository;
  userResponse: UserResponseRepository;
  weatherTile: WeatherTileRepository;
}

export const buildRepositories = (dataSource: DataSource): Repositories => ({
  acuteTreatmentWorseFeedbackOptions: new AcuteTreatmentWorseFeedbackOptionsRepository(
    dataSource.getRepository(AcuteTreatmentWorseFeedbackOptionsEntity),
  ),
  appVersion: new AppVersionRepository(dataSource.getRepository(AppVersionEntity)),
  device: new DeviceRepository(dataSource.getRepository(DeviceEntity)),
  migraineLog: new MigraineLogRepository(dataSource.getRepository(MigraineLogEntity)),
  newQuestion: new NewQuestionRepository(dataSource.getRepository(NewQuestionEntity)),
  newSelection: new NewSelectionRepository(dataSource.getRepository(NewSelectionEntity)),
  newTranslation: new NewTranslationRepository(dataSource.getRepository(NewTranslationEntity)),
  newUserResponse: new NewUserResponseRepository(dataSource.getRepository(NewUserResponseEntity)),
  preferredAnswers: new PreferredAnswersRepository(
    dataSource.getRepository(PreferredAnswersEntity),
  ),
  preventiveTreatment: new PreventiveTreatmentRepository(
    dataSource.getRepository(PreventiveTreatmentEntity),
  ),
  preventiveTreatmentSchedule: new PreventiveTreatmentScheduleRepository(
    dataSource.getRepository(PreventiveTreatmentScheduleEntity),
  ),
  preventiveTreatmentScheduleMetadata: new PreventiveTreatmentScheduleMetadataRepository(
    dataSource.getRepository(PreventiveTreatmentScheduleMetadataEntity),
  ),
  profile: new ProfileRepository(dataSource.getRepository(ProfileEntity)),
  pushNotificationToken: new PushNotificationTokenRepository(
    dataSource.getRepository(PushNotificationTokenEntity),
  ),
  question: new QuestionRepository(dataSource.getRepository(QuestionEntity)),
  selection: new SelectionRepository(dataSource.getRepository(SelectionEntity)),
  session: new SessionRepository(dataSource.getRepository(SessionEntity)),
  terraHealthData: new TerraHealthDataRepository(dataSource.getRepository(TerraHealthDataEntity)),
  terraUser: new TerraUserRepository(dataSource.getRepository(TerraUserEntity)),
  terraWebhookLog: new TerraWebhookLogRepository(dataSource.getRepository(TerraWebhookLogEntity)),
  translation: new TranslationRepository(dataSource.getRepository(TranslationEntity)),
  user: new UserRepository(dataSource.getRepository(UserEntity)),
  userDailyVitals: new UserDailyVitalsRepository(dataSource.getRepository(UserDailyVitalsEntity)),
  userResponse: new UserResponseRepository(dataSource.getRepository(UserResponseEntity)),
  weatherTile: new WeatherTileRepository(dataSource.getRepository(WeatherTileEntity)),
});
