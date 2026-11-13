/** Narrow adapter around Durable Object SQLite storage. */
/** @implements {import('../ports/IDatabase').IDatabase} */
export class CloudflareSQLiteDatabase {
  constructor(storage) {
    if (!storage?.sql || typeof storage.sql.exec !== "function" || typeof storage.transactionSync !== "function")
      throw new TypeError("SQLite storage and transactionSync are required");
    this.storage = storage;
  }
  exec(query, ...bindings) { return this.storage.sql.exec(query, ...bindings); }
  transaction(operation) {
    if (typeof operation !== "function") throw new TypeError("transaction operation is required");
    return this.storage.transactionSync(operation);
  }
}
