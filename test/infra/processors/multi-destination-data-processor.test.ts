import { MultiDestinationDataProcessor } from '@/infra/processors/multi-destination-data-processor';
import {
  DataProcessorInterface,
  TerraIngestionPayload,
} from '@/infra/processors/data-processor.interface';

describe('MultiDestinationDataProcessor', () => {
  const buildPayload = (): TerraIngestionPayload => ({
    terraUserId: 'terra-1',
    dataType: 'sleep',
    periodStart: new Date('2026-08-01T00:00:00.000Z'),
    periodEnd: new Date('2026-08-01T08:00:00.000Z'),
    receivedAt: new Date('2026-08-01T08:05:00.000Z'),
    data: { score: 80 },
  });

  const buildProcessor = (
    name: string,
    overrides: Partial<DataProcessorInterface> = {},
  ): jest.Mocked<DataProcessorInterface> =>
    ({
      getName: jest.fn().mockReturnValue(name),
      isEnabled: jest.fn().mockReturnValue(true),
      process: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    }) as unknown as jest.Mocked<DataProcessorInterface>;

  it('is enabled when at least one wrapped processor is enabled', () => {
    const disabled = buildProcessor('disabled', { isEnabled: jest.fn().mockReturnValue(false) });
    const enabled = buildProcessor('enabled');

    expect(new MultiDestinationDataProcessor([disabled]).isEnabled()).toBe(false);
    expect(new MultiDestinationDataProcessor([disabled, enabled]).isEnabled()).toBe(true);
  });

  it('dispatches to every enabled processor in parallel and aggregates successes', async () => {
    const disabled = buildProcessor('disabled', { isEnabled: jest.fn().mockReturnValue(false) });
    const a = buildProcessor('a');
    const b = buildProcessor('b');

    const result = await new MultiDestinationDataProcessor([disabled, a, b]).dispatch(
      buildPayload(),
    );

    expect(disabled.process).not.toHaveBeenCalled();
    expect(a.process).toHaveBeenCalledTimes(1);
    expect(b.process).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ succeeded: ['a', 'b'], failed: [] });
  });

  it('aggregates failures without letting one rejection stop the others', async () => {
    const ok = buildProcessor('ok');
    const failing = buildProcessor('failing', {
      process: jest.fn().mockRejectedValue(new Error('boom')),
    });

    const result = await new MultiDestinationDataProcessor([ok, failing]).dispatch(buildPayload());

    expect(result.succeeded).toEqual(['ok']);
    expect(result.failed).toEqual([{ processorName: 'failing', error: new Error('boom') }]);
  });

  it('wraps non-Error rejection reasons', async () => {
    const failing = buildProcessor('failing', { process: jest.fn().mockRejectedValue('nope') });

    const result = await new MultiDestinationDataProcessor([failing]).dispatch(buildPayload());

    expect(result.failed).toEqual([{ processorName: 'failing', error: new Error('nope') }]);
  });

  it('resolves process() when at least one processor succeeds', async () => {
    const ok = buildProcessor('ok');
    const failing = buildProcessor('failing', {
      process: jest.fn().mockRejectedValue(new Error('boom')),
    });

    await expect(
      new MultiDestinationDataProcessor([ok, failing]).process(buildPayload()),
    ).resolves.toBeUndefined();
  });

  it('rejects process() when every processor fails', async () => {
    const failing = buildProcessor('failing', {
      process: jest.fn().mockRejectedValue(new Error('boom')),
    });

    await expect(
      new MultiDestinationDataProcessor([failing]).process(buildPayload()),
    ).rejects.toThrow('All data processors failed: failing: boom');
  });
});
