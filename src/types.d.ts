export interface IDateEntry {
  availableAt: Date;
  redeemedAt: Date | null;
  expiresAt: Date;
}

export type ErrorType = "INVALID_ARGUMENT" | "INVALID_STATE" | "INTERNAL_ERROR";

// There is no nice way to extend error in TS, so instead I'm relying on an internal field to
// distinguish between different types of errors.
export interface RuntimeError extends Error {
  errorType: ErrorType;
}
