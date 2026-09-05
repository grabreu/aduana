import type { AduanaResponse, InternalConfig } from "./types";

export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
};

export type ValidationProblemDetails = ProblemDetails & {
  errors?: Record<string, string[]>;
};

export const isProblemDetails = (data: unknown): data is ProblemDetails =>
  !!data &&
  typeof data === "object" &&
  ("title" in data || "status" in data || "type" in data);

export const isValidationProblemDetails = (
  data: unknown,
): data is ValidationProblemDetails =>
  isProblemDetails(data) &&
  typeof data.errors === "object" &&
  data.errors !== null;

export class HttpError<T = unknown> extends Error {
  response?: AduanaResponse<T>;
  config: InternalConfig;
  isHttpError = true;

  constructor(
    message: string,
    config: InternalConfig,
    response?: AduanaResponse<T>,
  ) {
    super(message);
    this.name = "HttpError";
    this.config = config;
    this.response = response;
  }

  get problem(): ProblemDetails | undefined {
    const data = this.response?.data;
    return isProblemDetails(data) ? data : undefined;
  }
}

export const isHttpError = <T = unknown>(err: unknown): err is HttpError<T> =>
  !!err &&
  typeof err === "object" &&
  (err as { isHttpError?: unknown }).isHttpError === true;

export const isTransientError = (err: unknown): boolean => {
  if (!isHttpError(err)) {
    return false;
  }
  if (err.response) {
    return [502, 503, 504].includes(err.response.status);
  }
  return true;
};
