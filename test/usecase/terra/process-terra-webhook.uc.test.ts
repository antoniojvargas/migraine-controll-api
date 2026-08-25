import { ProcessTerraWebhookUc } from '@/usecase/terra/process-terra-webhook.uc';
import { TerraWebhookLogRepository } from '@/infra/database/repository/terra-webhook-log.repository';
import { MultiDestinationDataProcessor } from '@/infra/processors/multi-destination-data-processor';
import { TerraWebhookPayloadDto } from '@/dto/terra-webhook-payload.dto';
import { DomainError } from '@/domain/domain-error';

describe('ProcessTerraWebhookUc', () => {
  const buildRepository = (): jest.Mocked<TerraWebhookLogRepository> =>
    ({
      create: jest.fn().mockResolvedValue({}),
    }) as unknown as jest.Mocked<TerraWebhookLogRepository>;

  const buildProcessor = (): jest.Mocked<MultiDestinationDataProcessor> =>
    ({ dispatch: jest.fn() }) as unknown as jest.Mocked<MultiDestinationDataProcessor>;

  it('throws a DomainError when type is missing', async () => {
    const repository = buildRepository();
    const processor = buildProcessor();

    await expect(
      new ProcessTerraWebhookUc(repository, processor).execute({} as TerraWebhookPayloadDto),
    ).rejects.toThrow(DomainError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('logs a received event and does nothing else when there is no data', async () => {
    const repository = buildRepository();
    const processor = buildProcessor();

    const result = await new ProcessTerraWebhookUc(repository, processor).execute({
      type: 'auth',
      user: { user_id: 'terra-1' },
    });

    expect(result).toEqual({ status: 'ignored', processedItems: 0, failedItems: 0 });
    expect(processor.dispatch).not.toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        terraUserId: 'terra-1',
        eventType: 'auth',
        status: 'received',
      }),
    );
  });

  it('dispatches each data item, deriving the period from its metadata', async () => {
    const repository = buildRepository();
    const processor = buildProcessor();
    processor.dispatch.mockResolvedValue({ succeeded: ['Database'], failed: [] });

    const result = await new ProcessTerraWebhookUc(repository, processor).execute({
      type: 'sleep',
      user: { user_id: 'terra-1' },
      data: [
        {
          metadata: {
            start_time: '2026-08-01T00:00:00.000Z',
            end_time: '2026-08-01T08:00:00.000Z',
          },
          score: 80,
        },
      ],
    });

    expect(result).toEqual({ status: 'processed', processedItems: 1, failedItems: 0 });
    expect(processor.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        terraUserId: 'terra-1',
        dataType: 'sleep',
        periodStart: new Date('2026-08-01T00:00:00.000Z'),
        periodEnd: new Date('2026-08-01T08:00:00.000Z'),
      }),
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ terraUserId: 'terra-1', eventType: 'sleep', status: 'processed' }),
    );
  });

  it('falls back to receivedAt when metadata timestamps are missing', async () => {
    const repository = buildRepository();
    const processor = buildProcessor();
    processor.dispatch.mockResolvedValue({ succeeded: ['Database'], failed: [] });

    await new ProcessTerraWebhookUc(repository, processor).execute({
      type: 'daily',
      user: { user_id: 'terra-1' },
      data: [{ steps: 100 }],
    });

    const dispatched = processor.dispatch.mock.calls[0][0];
    expect(dispatched.periodStart).toEqual(dispatched.receivedAt);
    expect(dispatched.periodEnd).toEqual(dispatched.receivedAt);
  });

  it('reports partial_failure when only some items succeed', async () => {
    const repository = buildRepository();
    const processor = buildProcessor();
    processor.dispatch
      .mockResolvedValueOnce({ succeeded: ['Database'], failed: [] })
      .mockResolvedValueOnce({
        succeeded: [],
        failed: [{ processorName: 'Database', error: new Error('db down') }],
      });

    const result = await new ProcessTerraWebhookUc(repository, processor).execute({
      type: 'sleep',
      user: { user_id: 'terra-1' },
      data: [{ score: 80 }, { score: 90 }],
    });

    expect(result).toEqual({ status: 'partial_failure', processedItems: 1, failedItems: 1 });
    expect(repository.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'failed', errorMessage: 'Database: db down' }),
    );
  });

  it('reports failed when every item fails', async () => {
    const repository = buildRepository();
    const processor = buildProcessor();
    processor.dispatch.mockResolvedValue({
      succeeded: [],
      failed: [{ processorName: 'Database', error: new Error('db down') }],
    });

    const result = await new ProcessTerraWebhookUc(repository, processor).execute({
      type: 'sleep',
      user: { user_id: 'terra-1' },
      data: [{ score: 80 }],
    });

    expect(result).toEqual({ status: 'failed', processedItems: 0, failedItems: 1 });
  });

  it('uses "unknown" as terraUserId when the payload has no user', async () => {
    const repository = buildRepository();
    const processor = buildProcessor();
    processor.dispatch.mockResolvedValue({ succeeded: ['Database'], failed: [] });

    await new ProcessTerraWebhookUc(repository, processor).execute({
      type: 'sleep',
      data: [{ score: 80 }],
    });

    expect(processor.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ terraUserId: 'unknown' }),
    );
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ terraUserId: null }));
  });
});
