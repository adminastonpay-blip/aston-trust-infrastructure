export interface IAIProvider {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}
