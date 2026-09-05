# aduana

[![CI](https://github.com/grabreu/aduana/actions/workflows/ci.yml/badge.svg)](https://github.com/grabreu/aduana/actions/workflows/ci.yml)
[![CD](https://github.com/grabreu/aduana/actions/workflows/cd.yml/badge.svg)](https://github.com/grabreu/aduana/actions/workflows/cd.yml)
[![npm](https://img.shields.io/npm/v/%40grabreu%2Faduana.svg?style=flat-square&logo=npm&label=%40grabreu%2Faduana)](https://www.npmjs.com/package/@grabreu/aduana)
[![License](https://img.shields.io/github/license/grabreu/aduana?style=flat-square)](LICENSE)

A lightweight, type-safe fetch client for JavaScript/TypeScript.

```bash
npm install @grabreu/aduana
```

## Why

`fetch` works, but every project ends up rewriting the same boilerplate: joining `baseURL` with query params, JSON-encoding the body, throwing on a non-2xx response, parsing the error body, wiring up timeouts and cancellation. Aduana wraps `fetch` with that behavior built in, plus axios-style interceptors — nothing more.

```ts
import { create } from "@grabreu/aduana";

const api = create({
  baseURL: "https://api.example.com",
  headers: { Authorization: "Bearer token" },
});

const { data } = await api.get<User[]>("/users", { params: { active: true } });
```

A non-2xx response throws `HttpError` instead of resolving silently:

```ts
import { isHttpError } from "@grabreu/aduana";

try {
  await api.post("/users", { name: "Alice" });
} catch (err) {
  if (isHttpError(err)) {
    console.log(err.response?.status, err.problem?.title);
  }
}
```

## Errors

`HttpError` carries the failed `response` (when there is one) and exposes `.problem`, parsed as an [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807) `ProblemDetails` when the body matches:

```ts
import { isTransientError, isValidationProblemDetails } from "@grabreu/aduana";

if (isValidationProblemDetails(err.problem)) {
  // err.problem.errors: Record<string, string[]>
}

if (isTransientError(err)) {
  // network failure, timeout, or 502/503/504 — safe to retry
}
```

## Interceptors

```ts
api.interceptors.request.use((config) => ({
  ...config,
  headers: { ...config.headers, "X-Trace-Id": crypto.randomUUID() },
}));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isTransientError(error)) return retry(error.config);
    throw error;
  },
);
```

## Timeout & cancellation

```ts
await api.get("/slow", { timeout: 5000 });

const controller = new AbortController();
await api.get("/slow", { signal: controller.signal });
controller.abort();
```

Passing both together works too — whichever fires first wins.

## Development

```bash
pnpm install
pnpm dev         # build in watch mode
pnpm build       # production build (ESM + CJS + types)
pnpm test        # tests
pnpm typecheck
pnpm check       # biome (format + lint + import sort)
```

Releases (versioning, changelog, and npm publish) are automated via [release-please](https://github.com/googleapis/release-please) in CD.

## License

Licensed under the [MIT License](LICENSE).
