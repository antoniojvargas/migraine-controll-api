import supertest from 'supertest';
import { buildApp } from '@/factory/build-app';

describe('GET /health', () => {
  const app = buildApp();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds with status ok', async () => {
    const response = await supertest(app.server).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
