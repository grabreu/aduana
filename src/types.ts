export type ParamValue = string | number | boolean | null | undefined;
export type Params = Record<string, ParamValue | ParamValue[]>;

export type RequestConfig = {
  baseURL?: string;
  timeout?: number;
  params?: Params;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export type InternalConfig = RequestConfig & {
  url: string;
  method: string;
  body?: unknown;
};

export type AduanaResponse<T = unknown> = {
  data: T;
  status: number;
  statusText: string;
  config: InternalConfig;
  raw: Response;
};

export type CreateConfig = RequestConfig;
