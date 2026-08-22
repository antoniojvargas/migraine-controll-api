import { AppVersionRepository } from '@/infra/database/repository/app-version.repository';
import { FindAppVersionUc } from '@/usecase/find-app-version.uc';

describe('FindAppVersionUc', () => {
  const build = (entity: Record<string, unknown> | null) => {
    const repository = {
      findOneBy: jest.fn(async (criteria: { platform: string }) =>
        entity === null ? null : ({ id: 'av-1', ...entity, ...criteria } as never),
      ),
    } as unknown as AppVersionRepository;
    return { uc: new FindAppVersionUc(repository), repository };
  };

  it('does not require update when client version is current', async () => {
    const { uc } = build({
      platform: 'ios',
      version: '1.2.0',
      forceUpdate: true,
      announcement: false,
    });
    const result = await uc.execute({ platform: 'ios', currentVersion: '1.2.0' });
    expect(result).toMatchObject({ latestVersion: '1.2.0', updateRequired: false });
  });

  it('requires update when client is older and forceUpdate is enabled', async () => {
    const { uc } = build({
      platform: 'ios',
      version: '1.3.0',
      forceUpdate: true,
      announcement: true,
    });
    const result = await uc.execute({ platform: 'ios', currentVersion: '1.2.9' });
    expect(result.updateRequired).toBe(true);
  });

  it('ignores outdated clients when forceUpdate is disabled', async () => {
    const { uc } = build({
      platform: 'android',
      version: '2.0.0',
      forceUpdate: false,
      announcement: false,
    });
    const result = await uc.execute({ platform: 'android', currentVersion: '1.0.0' });
    expect(result.updateRequired).toBe(false);
  });

  it('throws a domain error for unsupported platforms', async () => {
    const { uc } = build(null);
    await expect(uc.execute({ platform: 'web', currentVersion: '1.0.0' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});
