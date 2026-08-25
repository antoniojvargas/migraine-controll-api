import Fastify, { FastifyInstance } from 'fastify';
import { DataSource } from 'typeorm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '@/config/logger';
import { envs } from '@/config/env';
import { registerErrorHandler } from '@/adapter/http/error-handler';
import { createGenReqId, registerRequestContext } from '@/adapter/http/plugins/request-context';
import { registerCors, CorsOptions } from '@/adapter/http/plugins/cors';
import { registerRateLimit, RateLimitOptions } from '@/adapter/http/plugins/rate-limit';
import { registerDocs, DocsOptions } from '@/adapter/http/plugins/docs';
import { AppVersionRepository } from '@/infra/database/repository/app-version.repository';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { AcuteTreatmentWorseFeedbackOptionsRepository } from '@/infra/database/repository/acute-treatment-worse-feedback-options.repository';
import { ProfileRepository } from '@/infra/database/repository/profile.repository';
import { MigraineLogRepository } from '@/infra/database/repository/migraine-log.repository';
import { PreventiveTreatmentRepository } from '@/infra/database/repository/preventive-treatment.repository';
import { UserResponseRepository } from '@/infra/database/repository/user-response.repository';
import { QuestionRepository } from '@/infra/database/repository/question.repository';
import { SelectionRepository } from '@/infra/database/repository/selection.repository';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';
import { TerraUserRepository } from '@/infra/database/repository/terra-user.repository';
import { TerraHealthDataRepository } from '@/infra/database/repository/terra-health-data.repository';
import { TerraWebhookLogRepository } from '@/infra/database/repository/terra-webhook-log.repository';
import { AppVersionEntity } from '@/infra/database/entities/app-version.entity';
import { PreferredAnswersEntity } from '@/infra/database/entities/preferred-answers.entity';
import { AcuteTreatmentWorseFeedbackOptionsEntity } from '@/infra/database/entities/acute-treatment-worse-feedback-options.entity';
import {
  ProfileEntity,
  MigraineLogEntity,
  PreventiveTreatmentEntity,
  UserResponseEntity,
  QuestionEntity,
  SelectionEntity,
  TranslationEntity,
  UserEntity,
  PushNotificationTokenEntity,
  TerraUserEntity,
  TerraHealthDataEntity,
  TerraWebhookLogEntity,
} from '@/infra/database/entities';
import { s3Client } from '@/infra/aws/s3Client';
import { DatabaseDataProcessor } from '@/infra/processors/database-data-processor';
import { S3DataProcessor } from '@/infra/processors/s3-data-processor';
import { DocumentDBDataProcessor } from '@/infra/processors/document-db-data-processor';
import { MultiDestinationDataProcessor } from '@/infra/processors/multi-destination-data-processor';
import { CognitoUserDirectoryAdapter } from '@/infra/aws/cognito-user-directory.adapter';
import { CognitoJwtVerifierAdapter } from '@/infra/aws/cognito-jwt-verifier.adapter';
import { CognitoIdentityProviderAdapter } from '@/infra/aws/cognito-identity-provider.adapter';
import { CognitoUserDirectoryPort } from '@/usecase/ports/cognito-user-directory.port';
import { CognitoIdentityProviderPort } from '@/usecase/ports/cognito-identity-provider.port';
import { CognitoJwtVerifierPort, registerAuth } from '@/adapter/http/plugins/auth';
import { FindAppVersionUc } from '@/usecase/find-app-version.uc';
import { UpsertPreferredAnswerUc } from '@/usecase/upsert-preferred-answer.uc';
import { FindPreferredAnswersByUserUc } from '@/usecase/find-preferred-answers-by-user.uc';
import { FindAcuteTreatmentWorseFeedbackOptionsUc } from '@/usecase/find-acute-treatment-worse-feedback-options.uc';
import { CreateProfileUc } from '@/usecase/create-profile.uc';
import { UpdateProfileUc } from '@/usecase/update-profile.uc';
import { CognitoUpdateUserAttributesUc } from '@/usecase/cognito-update-user-attributes.uc';
import { CreateMigraineLogUc } from '@/usecase/create-migraine-log.uc';
import { CreatePreventiveTreatmentUc } from '@/usecase/create-preventive-treatment.uc';
import { FindCalendarViewUc } from '@/usecase/find-calendar-view.uc';
import { CognitoDeleteUserUc } from '@/usecase/cognito-delete-user.uc';
import { ProcessTerraWebhookUc } from '@/usecase/terra/process-terra-webhook.uc';
import {
  AppVersionController,
  registerAppVersionRoutes,
} from '@/adapter/http/app-version.controller';
import {
  PreferredAnswersController,
  registerPreferredAnswersRoutes,
} from '@/adapter/http/preferred-answers.controller';
import {
  AcuteTreatmentFeedbackController,
  registerAcuteTreatmentFeedbackRoutes,
} from '@/adapter/http/acute-treatment-feedback.controller';
import { ProfileController, registerProfileRoutes } from '@/adapter/http/profile.controller';
import {
  MigraineLogController,
  registerMigraineLogRoutes,
} from '@/adapter/http/migraine-log.controller';
import {
  PreventiveTreatmentController,
  registerPreventiveTreatmentRoutes,
} from '@/adapter/http/preventive-treatment.controller';
import {
  CalendarViewController,
  registerCalendarViewRoutes,
} from '@/adapter/http/calendar-view.controller';
import { UserController, registerUserRoutes } from '@/adapter/http/user.controller';
import { TerraController, registerTerraRoutes } from '@/adapter/http/terra.controller';

export interface BuildAppOptions {
  dataSource?: DataSource;
  cors?: CorsOptions;
  rateLimit?: RateLimitOptions;
  docs?: DocsOptions;
  cognitoUserDirectory?: CognitoUserDirectoryPort;
  cognitoJwtVerifier?: CognitoJwtVerifierPort;
  cognitoIdentityProvider?: CognitoIdentityProviderPort;
}

export const buildApp = (options: BuildAppOptions = {}): FastifyInstance => {
  const app = Fastify({
    loggerInstance: logger,
    genReqId: createGenReqId(),
  }) as unknown as FastifyInstance;

  app.get('/health', async () => ({ status: 'ok' }));

  registerErrorHandler(app);
  registerRequestContext(app);
  registerCors(app, options.cors);
  registerRateLimit(app, {
    ...options.rateLimit,
    skip: options.rateLimit?.skip ?? ((request) => request.url.split('?')[0] === '/health'),
  });
  registerDocs(app, options.docs);

  const dataSource = options.dataSource;
  if (dataSource !== undefined) {
    const appVersionRepository = new AppVersionRepository(
      dataSource.getRepository(AppVersionEntity),
    );
    const preferredAnswersRepository = new PreferredAnswersRepository(
      dataSource.getRepository(PreferredAnswersEntity),
    );
    const feedbackOptionsRepository = new AcuteTreatmentWorseFeedbackOptionsRepository(
      dataSource.getRepository(AcuteTreatmentWorseFeedbackOptionsEntity),
    );
    const profileRepository = new ProfileRepository(dataSource.getRepository(ProfileEntity));
    const migraineLogRepository = new MigraineLogRepository(
      dataSource.getRepository(MigraineLogEntity),
    );
    const pushNotificationTokenRepository = new PushNotificationTokenRepository(
      dataSource.getRepository(PushNotificationTokenEntity),
    );
    const preventiveTreatmentRepository = new PreventiveTreatmentRepository(
      dataSource.getRepository(PreventiveTreatmentEntity),
    );
    const userResponseRepository = new UserResponseRepository(
      dataSource.getRepository(UserResponseEntity),
    );
    const questionRepository = new QuestionRepository(dataSource.getRepository(QuestionEntity));
    const selectionRepository = new SelectionRepository(dataSource.getRepository(SelectionEntity));
    const translationRepository = new TranslationRepository(
      dataSource.getRepository(TranslationEntity),
    );
    const userRepository = new UserRepository(dataSource.getRepository(UserEntity));
    const terraUserRepository = new TerraUserRepository(dataSource.getRepository(TerraUserEntity));
    const terraHealthDataRepository = new TerraHealthDataRepository(
      dataSource.getRepository(TerraHealthDataEntity),
    );
    const terraWebhookLogRepository = new TerraWebhookLogRepository(
      dataSource.getRepository(TerraWebhookLogEntity),
    );
    const legacyUserPoolId =
      envs.COGNITO_LEGACY_USER_POOL_ID === '' ? undefined : envs.COGNITO_LEGACY_USER_POOL_ID;
    const cognitoClient = new CognitoIdentityProviderClient({ region: envs.AWS_REGION });
    const cognitoUserDirectory =
      options.cognitoUserDirectory ??
      new CognitoUserDirectoryAdapter(cognitoClient, envs.COGNITO_USER_POOL_ID, legacyUserPoolId);
    const cognitoJwtVerifier =
      options.cognitoJwtVerifier ??
      new CognitoJwtVerifierAdapter(envs.COGNITO_USER_POOL_ID, legacyUserPoolId);
    const cognitoIdentityProvider =
      options.cognitoIdentityProvider ??
      new CognitoIdentityProviderAdapter(
        cognitoClient,
        envs.COGNITO_USER_POOL_ID,
        legacyUserPoolId,
      );
    const cognitoUpdateUserAttributesUc = new CognitoUpdateUserAttributesUc(
      cognitoIdentityProvider,
    );
    registerAuth(app, cognitoJwtVerifier, userRepository);

    registerAppVersionRoutes(
      app,
      new AppVersionController(new FindAppVersionUc(appVersionRepository)),
    );
    registerPreferredAnswersRoutes(
      app,
      new PreferredAnswersController(
        new UpsertPreferredAnswerUc(preferredAnswersRepository),
        new FindPreferredAnswersByUserUc(preferredAnswersRepository),
      ),
    );
    registerAcuteTreatmentFeedbackRoutes(
      app,
      new AcuteTreatmentFeedbackController(
        new FindAcuteTreatmentWorseFeedbackOptionsUc(feedbackOptionsRepository),
      ),
    );
    registerProfileRoutes(
      app,
      new ProfileController(
        new CreateProfileUc(profileRepository),
        new UpdateProfileUc(profileRepository, cognitoUpdateUserAttributesUc),
      ),
    );
    registerMigraineLogRoutes(
      app,
      new MigraineLogController(
        new CreateMigraineLogUc(
          migraineLogRepository,
          preferredAnswersRepository,
          userResponseRepository,
          questionRepository,
          selectionRepository,
          translationRepository,
          pushNotificationTokenRepository,
        ),
      ),
    );
    registerPreventiveTreatmentRoutes(
      app,
      new PreventiveTreatmentController(
        new CreatePreventiveTreatmentUc(
          preventiveTreatmentRepository,
          preferredAnswersRepository,
          userResponseRepository,
          questionRepository,
          selectionRepository,
          translationRepository,
        ),
      ),
    );
    registerCalendarViewRoutes(
      app,
      new CalendarViewController(new FindCalendarViewUc(migraineLogRepository)),
    );
    registerUserRoutes(
      app,
      new UserController(new CognitoDeleteUserUc(userRepository, cognitoUserDirectory)),
    );

    const multiDestinationDataProcessor = new MultiDestinationDataProcessor([
      new DatabaseDataProcessor(terraUserRepository, terraHealthDataRepository),
      new S3DataProcessor(s3Client, envs.TERRA_RAW_PAYLOADS_BUCKET),
      new DocumentDBDataProcessor(s3Client, {
        enabled: envs.DOCUMENTDB_ENABLED,
        connectionUri: envs.DOCUMENTDB_URI,
        databaseName: envs.DOCUMENTDB_DATABASE,
        collectionName: envs.DOCUMENTDB_COLLECTION,
        caBundleBucket: envs.CA_BUNDLES_BUCKET,
        caBundleKey: envs.CA_BUNDLE_KEY,
      }),
    ]);
    registerTerraRoutes(
      app,
      new TerraController(
        new ProcessTerraWebhookUc(terraWebhookLogRepository, multiDestinationDataProcessor),
      ),
    );
  }

  return app;
};
