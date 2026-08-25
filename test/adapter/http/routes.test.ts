import Fastify, { FastifyInstance } from 'fastify';
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
import { TerraController, registerTerraRoutes } from '@/adapter/http/terra.controller';
import { FindAppVersionUc } from '@/usecase/find-app-version.uc';
import { UpsertPreferredAnswerUc } from '@/usecase/upsert-preferred-answer.uc';
import { FindPreferredAnswersByUserUc } from '@/usecase/find-preferred-answers-by-user.uc';
import { FindAcuteTreatmentWorseFeedbackOptionsUc } from '@/usecase/find-acute-treatment-worse-feedback-options.uc';
import { ProcessTerraWebhookUc } from '@/usecase/terra/process-terra-webhook.uc';

describe('adapter/http routes', () => {
  const buildApp = (): FastifyInstance => {
    const app = Fastify({ logger: false });
    app.get('/health', async () => ({ status: 'ok' }));
    registerAppVersionRoutes(
      app,
      new AppVersionController({
        execute: jest.fn(async () => ({
          platform: 'ios',
          latestVersion: '1.2.0',
          forceUpdate: true,
          announcement: false,
          updateRequired: false,
        })),
      } as unknown as FindAppVersionUc),
    );
    registerPreferredAnswersRoutes(
      app,
      new PreferredAnswersController(
        {
          execute: jest.fn(async (input: Record<string, unknown>) => ({
            id: 'pa-1',
            userId: input.userId,
            questionId: input.questionId,
            selectionId: null,
            answerText: 'nota',
          })),
        } as unknown as UpsertPreferredAnswerUc,
        {
          execute: jest.fn(async () => []),
        } as unknown as FindPreferredAnswersByUserUc,
      ),
    );
    registerAcuteTreatmentFeedbackRoutes(
      app,
      new AcuteTreatmentFeedbackController({
        execute: jest.fn(async () => [{ id: 'o-1', key: 'no_change', text: 'Sin cambios' }]),
      } as unknown as FindAcuteTreatmentWorseFeedbackOptionsUc),
    );
    registerTerraRoutes(
      app,
      new TerraController({
        execute: jest.fn(async () => ({ status: 'processed', processedItems: 1, failedItems: 0 })),
      } as unknown as ProcessTerraWebhookUc),
    );
    return app;
  };

  it('GET /app-version returns the version check payload', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/app-version',
      query: { platform: 'ios', currentVersion: '1.2.0' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ platform: 'ios', updateRequired: false });
  });

  it('GET /app-version rejects missing query params with 400', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/app-version' });
    expect(response.statusCode).toBe(400);
  });

  it('PUT preferred answer returns the upserted record', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'PUT',
      url: '/users/11111111-1111-1111-1111-111111111111/preferred-answers/22222222-2222-2222-2222-222222222222',
      payload: { answerText: 'nota' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: 'pa-1', answerText: 'nota' });
  });

  it('rejects invalid uuid params with 400', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/users/not-a-uuid/preferred-answers',
    });
    expect(response.statusCode).toBe(400);
  });

  it('GET feedback options lists all entries', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/acute-treatment-worse-feedback-options',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
    expect(response.json()[0]).toMatchObject({ key: 'no_change' });
  });

  it('POST /terra/webhook dispatches the payload and returns the processing summary', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/terra/webhook',
      payload: { type: 'sleep', user: { user_id: 'terra-1' }, data: [{ score: 80 }] },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'processed', processedItems: 1, failedItems: 0 });
  });

  it('keeps /health working without a dataSource', async () => {
    const response = await buildApp().inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
