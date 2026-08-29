import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { Message, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { dataSource } from '@/infra/database/dataSource';
import {
  PushNotificationTokenEntity,
  QuestionEntity,
  SelectionEntity,
  UserEntity,
} from '@/infra/database/entities';
import { handler as postConfirmationHandler } from '@/infra/aws/cognito-triggers/post-confirmation';
import { PostConfirmationTriggerEvent } from '@/infra/aws/cognito-triggers/types';
import { API_URL, QUEUE_URL, SQS_ENDPOINT } from './constants';

const RECURRENCE_THRESHOLD = 5;

const sqsClient = new SQSClient({
  region: 'us-east-1',
  endpoint: SQS_ENDPOINT,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});

async function pollForMessage(): Promise<Message | null> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const result = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 2,
      }),
    );
    if (result.Messages !== undefined && result.Messages.length > 0) {
      return result.Messages[0];
    }
  }
  return null;
}

describe('Full flow (API + Postgres + Mongo via docker-compose)', () => {
  beforeAll(async () => {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('registro → creación de perfil → onboarding → log de migraña → notificación encolada', async () => {
    // 1. Registro: simula el trigger PostConfirmation de Cognito, que crea el usuario base.
    const externalId = `e2e-${randomUUID()}`;
    const email = `${externalId}@example.com`;
    const signUpEvent: PostConfirmationTriggerEvent = {
      version: '1',
      region: 'us-east-1',
      userPoolId: 'us-east-1_e2etest01',
      userName: externalId,
      triggerSource: 'PostConfirmation_ConfirmSignUp',
      request: { userAttributes: { email, sub: externalId } },
      response: {},
    };
    await postConfirmationHandler(signUpEvent);

    const user = await dataSource.getRepository(UserEntity).findOneByOrFail({ externalId });

    // El contenedor e2e corre con NODE_ENV=test, así que la API usa
    // InsecureBearerSubVerifier: el token Bearer es el `sub` (== externalId).
    const authHeader = `Bearer ${externalId}`;

    // 2. Creación de perfil, contra la API real levantada por docker-compose.
    const profileResponse = await request(API_URL)
      .post(`/users/${user.id}/profiles`)
      .set('Authorization', authHeader)
      .send({
        name: 'Ana',
        gender: 'f',
        birthDate: '1990-05-10',
        language: 'es',
        geohash6: 'dzn6c6',
      });
    expect(profileResponse.status).toBe(201);
    expect(profileResponse.body).toMatchObject({ userId: user.id, name: 'Ana' });

    // 3. Onboarding: responde una pregunta de síntomas típicos (seed mínimo de catálogo).
    const question = await dataSource.getRepository(QuestionEntity).save({
      key: `onboarding_symptom_${randomUUID()}`,
      type: 'single',
      order: 1,
    });
    const selection = await dataSource.getRepository(SelectionEntity).save({
      question: { id: question.id },
      key: 'sel_nausea',
      order: 1,
    });

    const onboardingResponse = await request(API_URL)
      .put(`/users/${user.id}/preferred-answers/${question.id}`)
      .set('Authorization', authHeader)
      .send({ selectionId: selection.id });
    expect(onboardingResponse.status).toBe(200);
    expect(onboardingResponse.body).toMatchObject({ userId: user.id, selectionId: selection.id });

    // Un dispositivo con push token registrado es el destino de la notificación encolada.
    await dataSource.getRepository(PushNotificationTokenEntity).save({
      user: { id: user.id },
      token: 'e2e-device-token',
      channel: 'ios',
    });

    // 4. Log de migraña: se repite el mismo síntoma hasta cruzar el umbral de recurrencia,
    // lo que dispara la notificación en la propia respuesta HTTP.
    let lastResponse: request.Response | undefined;
    for (let i = 0; i < RECURRENCE_THRESHOLD; i += 1) {
      lastResponse = await request(API_URL)
        .post(`/users/${user.id}/migraine-logs`)
        .set('Authorization', authHeader)
        .send({
          intensity: 6,
          painLocation: 'frontal',
          startedAt: new Date(Date.now() - (RECURRENCE_THRESHOLD - i) * 60_000).toISOString(),
          responses: [{ questionId: question.id, answerId: selection.id }],
        });
      expect(lastResponse.status).toBe(201);
    }
    expect(lastResponse?.body.recurrentSymptoms).toEqual([
      expect.objectContaining({ selectionId: selection.id, occurrences: RECURRENCE_THRESHOLD }),
    ]);

    // 5. Notificación encolada: se verifica que el mensaje realmente llegó a SQS (localstack).
    const message = await pollForMessage();
    expect(message).not.toBeNull();
    const body = JSON.parse(message?.Body ?? '{}') as {
      token: string;
      channel: string;
      payload: { title: string; data: Record<string, string> };
    };
    expect(body).toMatchObject({
      token: 'e2e-device-token',
      channel: 'ios',
      payload: {
        title: 'Recurring symptom detected',
        data: { selectionId: selection.id, occurrences: String(RECURRENCE_THRESHOLD) },
      },
    });
  });
});
