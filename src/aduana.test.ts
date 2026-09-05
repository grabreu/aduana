import { afterEach, describe, expect, it, vi } from "vitest";
import { Aduana, create } from "./aduana";
import { HttpError } from "./errors";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("HTTP methods", () => {
  it("get sends method GET and builds the URL from baseURL + params", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = create({ baseURL: "https://api.com" });
    const res = await api.get<{ ok: boolean }>("/users", {
      params: { active: true },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.com/users?active=true");
    expect(options?.method).toBe("GET");
    expect(res.data).toEqual({ ok: true });
    expect(res.status).toBe(200);
  });

  it("post/put/patch serialize the body as JSON with the correct Content-Type", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response(JSON.stringify({ id: 1 }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const api = create({ baseURL: "https://api.com" });

    for (const method of ["post", "put", "patch"] as const) {
      fetchMock.mockClear();
      await api[method]("/users", { name: "Alice" });
      const [, options] = fetchMock.mock.calls[0];
      const headers = options?.headers as Record<string, string>;
      expect(options?.method).toBe(method.toUpperCase());
      expect(options?.body).toBe(JSON.stringify({ name: "Alice" }));
      expect(headers["Content-Type"]).toBe("application/json");
    }
  });

  it("delete does not send a body", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response(null, { status: 204 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const api = create({ baseURL: "https://api.com" });

    const res = await api.delete("/users/1");
    const [, options] = fetchMock.mock.calls[0];
    expect(options?.method).toBe("DELETE");
    expect(options?.body).toBeUndefined();
    expect(res.data).toBeUndefined();
  });
});

describe("HTTP errors", () => {
  it("a status outside 2xx throws HttpError with .response attached", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response(JSON.stringify({ title: "Not Found", status: 404 }), {
          status: 404,
          headers: { "Content-Type": "application/problem+json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const api = create({ baseURL: "https://api.com" });

    await expect(api.get("/users/999")).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(HttpError);
      const httpErr = err as HttpError;
      expect(httpErr.response?.status).toBe(404);
      expect(httpErr.problem?.title).toBe("Not Found");
      return true;
    });
  });

  it("a non-JSON response (e.g. HTML from a proxy/502) preserves the raw text instead of becoming null", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response("<html>Bad Gateway</html>", {
          status: 502,
          headers: { "Content-Type": "text/html" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const api = create({ baseURL: "https://api.com" });

    await expect(api.get("/anything")).rejects.toSatisfy((err: unknown) => {
      const httpErr = err as HttpError;
      expect(httpErr.response?.data).toBe("<html>Bad Gateway</html>");
      return true;
    });
  });

  it("malformed JSON with a json content-type preserves the raw text instead of null", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response("{ this is not valid json", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const api = create({ baseURL: "https://api.com" });

    const res = await api.get("/anything");
    expect(res.data).toBe("{ this is not valid json");
  });

  it("an unsupported body (FormData) fails loudly before calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const api = create({ baseURL: "https://api.com" });

    await expect(api.post("/upload", new FormData())).rejects.toThrow(/JSON/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("headers", () => {
  it("merges the instance's default headers with the call's headers, without losing Content-Type", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = create({
      baseURL: "https://api.com",
      headers: { Authorization: "Bearer abc" },
    });
    await api.get("/users", { headers: { "X-Trace-Id": "123" } });

    const [, options] = fetchMock.mock.calls[0];
    const headers = options?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer abc");
    expect(headers["X-Trace-Id"]).toBe("123");
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

describe("default + per-call params", () => {
  it("merges instead of replacing the whole object", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = create({
      baseURL: "https://api.com",
      params: { tenant: "acme" },
    });
    await api.get("/users", { params: { active: true } });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("tenant=acme");
    expect(url).toContain("active=true");
  });
});

describe("interceptors", () => {
  it("a request interceptor runs before fetch and can change the config", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = new Aduana({ baseURL: "https://api.com" });
    api.interceptors.request.use((config) => ({
      ...config,
      headers: { ...config.headers, "X-Ping": "1" },
    }));

    await api.get("/x");
    const [, options] = fetchMock.mock.calls[0];
    const headers = options?.headers as Record<string, string>;
    expect(headers["X-Ping"]).toBe("1");
  });

  it("a response interceptor runs on success", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response(JSON.stringify({ a: 1 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = new Aduana({ baseURL: "https://api.com" });
    let ran = false;
    api.interceptors.response.use((res) => {
      ran = true;
      return res;
    });

    await api.get("/x");
    expect(ran).toBe(true);
  });

  it("a response interceptor can recover from an error", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response(JSON.stringify({ title: "boom" }), { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = new Aduana({ baseURL: "https://api.com" });
    api.interceptors.response.use(
      (res) => res,
      (_err) => ({
        data: { recovered: true },
        status: 200,
        statusText: "OK (recovered)",
        config: { url: "/x", method: "GET" },
        raw: new Response(),
      }),
    );

    const res = await api.get("/x");
    expect(res.data).toEqual({ recovered: true });
  });

  it("eject removes the interceptor without affecting other ids", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _options?: RequestInit) =>
        new Response(JSON.stringify({}), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = new Aduana({ baseURL: "https://api.com" });
    let firstRan = false;
    let secondRan = false;
    const firstId = api.interceptors.request.use((c) => {
      firstRan = true;
      return c;
    });
    api.interceptors.request.use((c) => {
      secondRan = true;
      return c;
    });

    api.interceptors.request.eject(firstId);
    await api.get("/x");

    expect(firstRan).toBe(false);
    expect(secondRan).toBe(true);
  });
});

describe("timeout and cancellation", () => {
  it("timeout aborts the request and throws HttpError with a timeout message", async () => {
    const fetchMock = vi.fn(
      (_url: string, options?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const timer = setTimeout(() => resolve(new Response("ok")), 200);
          options?.signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = create({ baseURL: "https://api.com", timeout: 10 });
    await expect(api.get("/slow")).rejects.toThrow("Request timed out");
  });

  it("timeout still works when an external signal is also passed (regression test)", async () => {
    const fetchMock = vi.fn(
      (_url: string, options?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const timer = setTimeout(() => resolve(new Response("ok")), 200);
          options?.signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const externalController = new AbortController();
    const api = create({ baseURL: "https://api.com", timeout: 10 });

    await expect(
      api.get("/slow", { signal: externalController.signal }),
    ).rejects.toThrow("Request timed out");
  });

  it("an external abort (without timeout) produces a cancellation message, not a timeout one", async () => {
    const fetchMock = vi.fn(
      (_url: string, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          if (options?.signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          options?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const externalController = new AbortController();
    const api = create({ baseURL: "https://api.com" });

    const promise = api.get("/slow", { signal: externalController.signal });
    externalController.abort();

    await expect(promise).rejects.toThrow("Request cancelled");
  });

  it("still reports cancellation when the external signal aborts with a custom reason", async () => {
    const fetchMock = vi.fn(
      (_url: string, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          if (options?.signal?.aborted) {
            reject(options.signal.reason);
            return;
          }
          options?.signal?.addEventListener("abort", () => {
            reject(options.signal?.reason);
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const externalController = new AbortController();
    const api = create({ baseURL: "https://api.com" });

    const promise = api.get("/slow", { signal: externalController.signal });
    externalController.abort(new Error("user cancelled"));

    await expect(promise).rejects.toThrow("Request cancelled");
  });
});
