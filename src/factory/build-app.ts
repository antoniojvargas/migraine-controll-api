import Fastify, { FastifyInstance } from 'fastify';
import { DataSource } from 'typeorm';
import { logger } from '@/config/logger';
import { registerErrorHandler } from '@/adapter/http/error-handler';
import { createGenReqId, registerRequestContext } from '@/adapter/http/plugins/request-context';
import { registerCors, CorsOptions } from '@/adapter/http/plugins/cors';
import { registerRateLimit, RateLimitOptions } from '@/adapter/http/plugins/rate-limit';
import { AppVersionRepository } from '@/infra/database/repository/app-version.repository';
import { PreferredAnswersRepository } from '@/infra/database/repository/preferred-answers.repository';
import { AcuteTreatmentWorseFeedbackOptionsRepository } from '@/infra/database/repository/acute-treatment-worse-feedback-options.repository';
import { AppVersionEntity } from '@/infra/database/entities/app-version.entity';
import { PreferredAnswersEntity } from '@/infra/database/entities/preferred-answers.entity';
import { AcuteTreatmentWorseFeedbackOptionsEntity } from '@/infra/database/entities/acute-treatment-worse-feedback-options.entity';
import { FindAppVersionUc } from '@/usecase/find-app-version.uc';
import { UpsertPreferredAnswerUc } from '@/usecase/upsert-preferred-answer.uc';
import { FindPreferredAnswersByUserUc } from '@/usecase/find-preferred-answers-by-user.uc';
import { FindAcuteTreatmentWorseFeedbackOptionsUc } from '@/usecase/find-acute-treatment-worse-feedback-options.uc';
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

export interface BuildAppOptions {
  dataSource?: DataSource;
  cors?: CorsOptions;
  rateLimit?: RateLimitOptions;
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
  registerRateLimit(app, options.rateLimit);

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
  }

  return app;
};
