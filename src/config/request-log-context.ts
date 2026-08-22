import { AsyncLocalStorage } from 'async_hooks';

export interface RequestLogContext {
  requestId: string;
  correlationId: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestLogContext>();

export const runWithRequestLogContext = <T>(context: RequestLogContext, callback: () => T): T =>
  asyncLocalStorage.run(context, callback);

export const enterRequestLogContext = (context: RequestLogContext): void => {
  asyncLocalStorage.enterWith(context);
};

export const getRequestLogContext = (): RequestLogContext | undefined =>
  asyncLocalStorage.getStore();

export type LogMixin = () => Record<string, unknown>;

export const requestLogMixin: LogMixin = () => {
  const store = getRequestLogContext();
  if (store === undefined) {
    return {};
  }
  return { requestId: store.requestId, correlationId: store.correlationId };
};
