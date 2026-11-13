export class CoreError extends Error {
  constructor(code, message = code, status = 409) {
    super(message);
    this.name = "CoreError";
    this.code = code;
    this.status = status;
  }
}
