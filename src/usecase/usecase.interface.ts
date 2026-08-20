export interface UseCaseInterface<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
