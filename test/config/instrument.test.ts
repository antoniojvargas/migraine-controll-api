describe('instrument', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('disables Sentry when no DSN is configured', () => {
    const init = jest.fn();
    jest.doMock('@sentry/node', () => ({ init }));
    jest.doMock('@/config/env', () => ({ envs: { SENTRY_DSN: '', NODE_ENV: 'test' } }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/config/instrument');

    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: undefined, enabled: false, environment: 'test' }),
    );
  });

  it('enables Sentry with the configured DSN', () => {
    const init = jest.fn();
    jest.doMock('@sentry/node', () => ({ init }));
    jest.doMock('@/config/env', () => ({
      envs: { SENTRY_DSN: 'https://example.ingest.sentry.io/1', NODE_ENV: 'production' },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/config/instrument');

    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://example.ingest.sentry.io/1',
        enabled: true,
        environment: 'production',
      }),
    );
  });
});
