export interface SqlResult<T> { toArray(): T[] }
export interface IDatabase {
  exec<T = Record<string, unknown>>(query: string, ...bindings: unknown[]): SqlResult<T>;
  transaction<T>(operation: () => T): T;
}
