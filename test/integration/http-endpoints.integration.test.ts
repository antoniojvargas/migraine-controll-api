import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { dataSource } from '@/infra/database/dataSource';
import { UserEntity } from '@/infra/database/entities';
import { buildApp } from '@/factory/build-app';
import { CognitoUserDirectoryPort } from '@/usecase/ports/cognito-user-directory.port';
import { CognitoIdentityProviderPort } from '@/usecase/ports/cognito-identity-provider.port';
import { CognitoJwtVerifierPort } from '@/adapter/http/plugins/auth';
import { initTestDb } from './helpers';

describe('HTTP endpoints (real Postgres via Docker)', () => {
  let app: FastifyInstance;
  const cognitoUserDirectory: CognitoUserDirectoryPort = {
    findUserBySub: jest.fn().mockResolvedValue(null),
    findUserByEmail: jest.fn().mockResolvedValue(null),
    tombstoneUser: jest.fn(),
    deleteUser: jest.fn(),
  };
  const cognitoIdentityProvider: CognitoIdentityProviderPort = {
    updateUserAttributes: jest.fn(),
  };
  const cognitoJwtVerifier: CognitoJwtVerifierPort = {
    verify: jest.fn(async (token: string) => {
      if (token === 'invalid-token') {
        throw new Error('invalid token');
      }
      return { sub: token };
    }),
  };

  beforeAll(async () => {
    await initTestDb();
    app = buildApp({
      dataSource,
      cognitoUserDirectory,
      cognitoIdentityProvider,
      cognitoJwtVerifier,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await dataSource.destroy();
  });

  async function createUser(email: string): Promise<UserEntity> {
    return dataSource.getRepository(UserEntity).save({ email, externalId: `ext-${email}` });
  }

  // El verifier mock devuelve { sub: token }; authenticateOwner resuelve el
  // usuario por externalId y exige que coincida con :userId de la ruta.
  const auth = (user: UserEntity): { Authorization: string } => ({
    Authorization: `Bearer ${user.externalId}`,
  });

  describe('ownership guard on /users/:userId/*', () => {
    it('returns 401 without an Authorization header', async () => {
      const user = await createUser('guard-anon@test.com');

      const response = await request(app.server).get(`/users/${user.id}/calendar-view`);

      expect(response.status).toBe(401);
    });

    it('returns 403 when the token belongs to another user', async () => {
      const owner = await createUser('guard-owner@test.com');
      const intruder = await createUser('guard-intruder@test.com');

      const response = await request(app.server)
        .get(`/users/${owner.id}/calendar-view`)
        .set(auth(intruder));

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ code: 'FORBIDDEN' });
    });
  });

  describe('POST /users/:userId/profiles', () => {
    it('creates a profile for the user', async () => {
      const user = await createUser('profiles-a@test.com');

      const response = await request(app.server)
        .post(`/users/${user.id}/profiles`)
        .set(auth(user))
        .send({
          name: 'Ana',
          gender: 'f',
          birthDate: '1990-05-10',
          language: 'es',
          geohash6: 'dzn6c6',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        userId: user.id,
        name: 'Ana',
        gender: 'f',
        language: 'es',
      });
    });

    it('rejects an invalid language', async () => {
      const user = await createUser('profiles-b@test.com');

      const response = await request(app.server)
        .post(`/users/${user.id}/profiles`)
        .set(auth(user))
        .send({
          name: 'Ana',
          gender: 'f',
          birthDate: '1990-05-10',
          language: '123',
          geohash6: 'dzn6c6',
        });

      // El schema Joi de la capa HTTP rechaza el formato antes de que llegue al dominio.
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ code: 'VALIDATION_ERROR' });
    });
  });

  describe('PATCH /users/:userId/profiles', () => {
    it('updates the profile and syncs changed attributes to Cognito', async () => {
      const user = await createUser('profiles-c@test.com');
      await request(app.server).post(`/users/${user.id}/profiles`).set(auth(user)).send({
        name: 'Ana',
        gender: 'f',
        birthDate: '1990-05-10',
        language: 'es',
        geohash6: 'dzn6c6',
      });

      const response = await request(app.server)
        .patch(`/users/${user.id}/profiles`)
        .set(auth(user))
        .send({ name: 'Ana Maria', gender: 'nb' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: user.id,
        name: 'Ana Maria',
        gender: 'nb',
      });
      expect(cognitoIdentityProvider.updateUserAttributes).toHaveBeenCalledWith({
        externalId: user.externalId,
        attributes: { name: 'Ana Maria', gender: 'nb' },
      });
    });

    it('returns 404 when the profile does not exist', async () => {
      const user = await createUser('profiles-d@test.com');

      const response = await request(app.server)
        .patch(`/users/${user.id}/profiles`)
        .set(auth(user))
        .send({ name: 'Ana Maria' });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ code: 'PROFILE_NOT_FOUND' });
    });
  });

  describe('POST /users/:userId/migraine-logs', () => {
    it('creates a migraine log for the user', async () => {
      const user = await createUser('logs-a@test.com');

      const response = await request(app.server)
        .post(`/users/${user.id}/migraine-logs`)
        .set(auth(user))
        .send({
          intensity: 6,
          painLocation: 'frontal',
          startedAt: '2026-01-01T10:00:00.000Z',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        userId: user.id,
        intensity: 6,
        painLocation: 'frontal',
        responses: [],
      });
    });

    it('rejects a startedAt in the future', async () => {
      const user = await createUser('logs-b@test.com');
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app.server)
        .post(`/users/${user.id}/migraine-logs`)
        .set(auth(user))
        .send({
          intensity: 5,
          painLocation: 'frontal',
          startedAt: future,
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ code: 'DOMAIN_VALIDATION_ERROR' });
    });
  });

  describe('POST /users/:userId/preventive-treatments', () => {
    it('creates a preventive treatment for the user', async () => {
      const user = await createUser('treatments-a@test.com');

      const response = await request(app.server)
        .post(`/users/${user.id}/preventive-treatments`)
        .set(auth(user))
        .send({ name: 'Propranolol' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        userId: user.id,
        name: 'Propranolol',
        isRecurrent: false,
        responses: [],
      });
    });

    it('rejects repeatUntil without isRecurrent', async () => {
      const user = await createUser('treatments-b@test.com');
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app.server)
        .post(`/users/${user.id}/preventive-treatments`)
        .set(auth(user))
        .send({ name: 'Topiramate', repeatUntil: future });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ code: 'DOMAIN_VALIDATION_ERROR' });
    });
  });

  describe('GET /users/:userId/calendar-view', () => {
    it('groups the user migraine logs by local date', async () => {
      const user = await createUser('calendar-a@test.com');
      await request(app.server).post(`/users/${user.id}/migraine-logs`).set(auth(user)).send({
        intensity: 7,
        painLocation: 'occipital',
        startedAt: '2026-01-15T12:00:00.000Z',
      });

      const response = await request(app.server)
        .get(`/users/${user.id}/calendar-view`)
        .set(auth(user));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: user.id,
        months: [{ year: 2026, month: 1, days: [{ day: 15 }] }],
      });
    });

    it('returns an empty calendar when the user has no logs', async () => {
      const user = await createUser('calendar-b@test.com');

      const response = await request(app.server)
        .get(`/users/${user.id}/calendar-view`)
        .set(auth(user));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ userId: user.id, months: [] });
    });
  });

  describe('DELETE /users/me', () => {
    it('deletes the authenticated user resolved from the Cognito JWT', async () => {
      const user = await createUser('delete-me-a@test.com');

      const response = await request(app.server)
        .delete('/users/me')
        .set('Authorization', `Bearer ${user.externalId}`);

      expect(response.status).toBe(204);

      const stillFound = await dataSource.getRepository(UserEntity).findOneBy({ id: user.id });
      expect(stillFound).toBeNull();
    });

    it('returns 401 when the Authorization header is missing', async () => {
      const response = await request(app.server).delete('/users/me');

      expect(response.status).toBe(401);
    });

    it('returns 401 when the JWT fails verification', async () => {
      const response = await request(app.server)
        .delete('/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
