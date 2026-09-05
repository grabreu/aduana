import { HttpError } from "./errors";
import { InterceptorManager } from "./interceptors";
import type {
  AduanaResponse,
  CreateConfig,
  InternalConfig,
  RequestConfig,
} from "./types";
import { buildUrl } from "./url";

const assertJsonBody = (body: unknown): void => {
  const isUnsupported =
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body as ArrayBufferView);

  if (isUnsupported) {
    throw new Error(
      "Aduana only supports a JSON body for now (FormData/Blob/URLSearchParams/ArrayBuffer are not serialized correctly). File upload is on the roadmap.",
    );
  }
};

export class Aduana {
  defaults: RequestConfig;
  interceptors: {
    request: InterceptorManager<InternalConfig>;
    response: InterceptorManager<AduanaResponse<unknown>>;
  };

  constructor(defaults: RequestConfig = {}) {
    this.defaults = defaults;
    this.interceptors = {
      request: new InterceptorManager<InternalConfig>(),
      response: new InterceptorManager<AduanaResponse<unknown>>(),
    };
  }

  request<T = unknown>(config: InternalConfig): Promise<AduanaResponse<T>> {
    const merged: InternalConfig = {
      ...this.defaults,
      ...config,
      baseURL: config.baseURL ?? this.defaults.baseURL,
      params: { ...this.defaults.params, ...config.params },
      headers: { ...this.defaults.headers, ...config.headers },
    };

    // biome-ignore lint/suspicious/noExplicitAny: heterogeneous pipeline (config -> response)
    let chain: Promise<any> = Promise.resolve(merged);
    this.interceptors.request.forEach(({ fulfilled, rejected }) => {
      chain = chain.then(fulfilled, rejected);
    });

    chain = chain.then((finalConfig: InternalConfig) =>
      this.dispatchRequest<T>(finalConfig),
    );

    this.interceptors.response.forEach(({ fulfilled, rejected }) => {
      chain = chain.then(fulfilled, rejected);
    });

    return chain;
  }

  private async dispatchRequest<T>(
    config: InternalConfig,
  ): Promise<AduanaResponse<T>> {
    const { url, baseURL, params, timeout, signal, method, body, headers } =
      config;
    const fullUrl = buildUrl(url, baseURL, params);

    if (body !== undefined) {
      assertJsonBody(body);
    }

    const controller = new AbortController();
    let timedOut = false;
    let cancelled = false;
    const timer = timeout
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeout)
      : undefined;

    const onExternalAbort = () => {
      cancelled = true;
      controller.abort(signal?.reason);
    };
    if (signal) {
      if (signal.aborted) {
        onExternalAbort();
      } else {
        signal.addEventListener("abort", onExternalAbort, { once: true });
      }
    }

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      // biome-ignore lint/suspicious/noExplicitAny: fetch error shape varies across runtimes
      const anyErr = err as any;
      const message = timedOut
        ? "Request timed out"
        : cancelled
          ? "Request cancelled"
          : (anyErr?.message ?? "Network failure");
      throw new HttpError(message, config);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
      if (signal) {
        signal.removeEventListener("abort", onExternalAbort);
      }
    }

    const data = await this.parseBody<T>(response);

    const aduanaResponse: AduanaResponse<T> = {
      data,
      status: response.status,
      statusText: response.statusText,
      config,
      raw: response,
    };

    if (!response.ok) {
      throw new HttpError(
        `Request failed with status ${response.status}`,
        config,
        aduanaResponse,
      );
    }

    return aduanaResponse;
  }

  private async parseBody<T>(response: Response): Promise<T> {
    if (response.status === 204 || response.status === 205) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text().catch(() => "");
    if (!text) {
      return undefined as T;
    }

    if (contentType.includes("json")) {
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    }

    return text as unknown as T;
  }

  get<T = unknown>(url: string, config: RequestConfig = {}) {
    return this.request<T>({ ...config, url, method: "GET" });
  }

  delete<T = unknown>(url: string, config: RequestConfig = {}) {
    return this.request<T>({ ...config, url, method: "DELETE" });
  }

  post<T = unknown>(url: string, body?: unknown, config: RequestConfig = {}) {
    return this.request<T>({ ...config, url, method: "POST", body });
  }

  put<T = unknown>(url: string, body?: unknown, config: RequestConfig = {}) {
    return this.request<T>({ ...config, url, method: "PUT", body });
  }

  patch<T = unknown>(url: string, body?: unknown, config: RequestConfig = {}) {
    return this.request<T>({ ...config, url, method: "PATCH", body });
  }
}

export const create = (config: CreateConfig = {}): Aduana => new Aduana(config);
