import { DataSource } from 'typeorm';
import { BaseSeeder } from '@/infra/database/seeds/utils/baseSeeder';
import { runSeeders, SeederEntry } from '@/infra/database/seeds/populate';

describe('runSeeders', () => {
  const buildEntry = (
    name: string,
    options: { optional?: boolean; fail?: boolean } = {},
  ): { entry: SeederEntry; run: jest.Mock } => {
    const run = jest.fn(
      options.fail === true
        ? async () => {
            throw new Error(`[seed:${name}] boom`);
          }
        : async () => [],
    );
    const seeder = { run } as unknown as BaseSeeder;
    return { entry: { name, seeder, optional: options.optional }, run };
  };

  const buildLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  });

  it('runs every seeder sequentially in dependency order', async () => {
    const calls: string[] = [];
    const makeEntry = (name: string): SeederEntry => {
      const seeder = {
        run: jest.fn(async () => {
          calls.push(name);
        }),
      } as unknown as BaseSeeder;
      return { name, seeder };
    };
    const dataSource = {} as DataSource;

    await runSeeders(dataSource, [makeEntry('a'), makeEntry('b'), makeEntry('c')], buildLogger());

    expect(calls).toEqual(['a', 'b', 'c']);
  });

  it('continues when an optional seeder fails and logs a warning', async () => {
    const first = buildEntry('first');
    const optionalFailing = buildEntry('optional_one', { optional: true, fail: true });
    const last = buildEntry('last');
    const log = buildLogger();
    const dataSource = {} as DataSource;

    await runSeeders(dataSource, [first.entry, optionalFailing.entry, last.entry], log);

    expect(first.run).toHaveBeenCalledTimes(1);
    expect(optionalFailing.run).toHaveBeenCalledTimes(1);
    expect(last.run).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('[seed] optional_one: skipped'));
  });

  it('aborts and rethrows when a critical seeder fails', async () => {
    const failing = buildEntry('critical_one', { fail: true });
    const never = buildEntry('never_run');
    const log = buildLogger();
    const dataSource = {} as DataSource;

    await expect(runSeeders(dataSource, [failing.entry, never.entry], log)).rejects.toThrow(
      '[seed:critical_one] boom',
    );

    expect(never.run).not.toHaveBeenCalled();
  });
});
