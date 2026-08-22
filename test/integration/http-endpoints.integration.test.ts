import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { dataSource } from '@/infra/database/dataSource';
import { UserEntity } from '@/infra/database/entities';
import { buildApp } from '@/factory/build-app';
import { initTestDb } from './helpers';

describe('HTTP endpoints (real Postgres via Docker)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await initTestDb();
    app = buildApp({ dataSource });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await dataSource.destroy();
  });

  async function createUser(email: string): Promise<UserEntity> {
    return dataSource.getRepository(UserEntity).save({ email, externalId: `ext-${email}` });
  }

  describe('POST /users/:userId/profiles', () => {
    it('creates a profile for the user', async () => {
      const user = await createUser('profiles-a@test.com');

      const response = await request(app.server).post(`/users/${user.id}/profiles`).send({
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

      const response = await request(app.server).post(`/users/${user.id}/profiles`).send({
        name: 'Ana',
        gender: 'f',
        birthDate: '1990-05-10',
        language: '123',
        geohash6: 'dzn6c6',
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ code: 'DOMAIN_VALIDATION_ERROR' });
    });
  });

  describe('POST /users/:userId/migraine-logs', () => {
    it('creates a migraine log for the user', async () => {
      const user = await createUser('logs-a@test.com');

      const response = await request(app.server).post(`/users/${user.id}/migraine-logs`).send({
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

      const response = await request(app.server).post(`/users/${user.id}/migraine-logs`).send({
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
        .send({ name: 'Topiramate', repeatUntil: future });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ code: 'DOMAIN_VALIDATION_ERROR' });
    });
  });

  describe('GET /users/:userId/calendar-view', () => {
    it('groups the user migraine logs by local date', async () => {
      const user = await createUser('calendar-a@test.com');
      await request(app.server).post(`/users/${user.id}/migraine-logs`).send({
        intensity: 7,
        painLocation: 'occipital',
        startedAt: '2026-01-15T12:00:00.000Z',
      });

      const response = await request(app.server).get(`/users/${user.id}/calendar-view`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: user.id,
        months: [{ year: 2026, month: 1, days: [{ day: 15 }] }],
      });
    });

    it('returns an empty calendar when the user has no logs', async () => {
      const user = await createUser('calendar-b@test.com');

      const response = await request(app.server).get(`/users/${user.id}/calendar-view`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ userId: user.id, months: [] });
    });
  });
});
