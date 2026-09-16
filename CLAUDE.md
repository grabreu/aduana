# aduana

## Repository

A single TypeScript package published as [`@grabreu/aduana`](https://www.npmjs.com/package/@grabreu/aduana): a lightweight, axios-style fetch client.

Read `README.md` before making changes — it documents the actual public API (`Why`, `Errors`, `Interceptors`, `Timeout & cancellation`).

## General Rules

- Keep changes scoped to the requested change.
- Prefer existing patterns over introducing new abstractions.
- Do not add dependencies unless they are necessary.
- Do not fill gaps with assumptions when the user hasn't given the information — ask, or mark it as pending.
- Do not claim a validation command passed unless it was actually run.
- Code, comments, commit messages, and documentation are always written in English.

## Git

- Do not create or switch branches unless explicitly requested.
- Do not create commits unless explicitly requested.
- Do not push unless explicitly requested.
- Keep commits focused on the requested change.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`type: summary`).

## Documentation

### Audience

A developer evaluating whether to add this as a dependency. Not onboarding material — keep it concise and skimmable.

### Content Rules

- State facts concisely. Avoid unnecessary explanations or trailing rationale.
- Do not document information that is already obvious from the repository structure or configuration.
- Do not invent features, API shapes, or future direction — mark undecided things as TODO.
- Document a capability only after it is implemented and verified.
- Use proper Markdown headings (`##`, `###`), not bold text as headings.

---

## Project-Specific Guidelines

### Source

- `src/aduana.ts` - the `Aduana` class: `request`/`get`/`post`/`put`/`patch`/`delete`, the interceptor chain, timeout/abort handling.
- `src/interceptors.ts` - `InterceptorManager`, used for both the request and response chains.
- `src/errors.ts` - `HttpError`, RFC 7807 `ProblemDetails` helpers, `isTransientError`.
- `src/url.ts` - URL joining and query-string building.
- `src/types.ts` - public config/response types.
- `src/index.ts` - public exports, including the default singleton instance.

Every exported function/class should have a matching `*.test.ts` file.

### Validation

Run `pnpm check`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before considering a change done — CI (`.github/workflows/ci.yml`) runs the same on push/PR to `main`.
