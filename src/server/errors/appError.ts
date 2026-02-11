export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly expose: boolean;

  constructor(code: string, message: string, status: number, expose = true) {
    super(message);
    this.code = code;
    this.status = status;
    this.expose = expose;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function toPublicError(err: AppError): {
  code: string;
  message: string;
  status: number;
} {
  if (err.expose) {
    return { code: err.code, message: err.message, status: err.status };
  }
  return { code: "INTERNAL_ERROR", message: "Unexpected error", status: 500 };
}
