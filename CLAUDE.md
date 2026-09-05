# aduana

## Repository

A single TypeScript package published as [`@grabreu/aduana`](https://www.npmjs.com/package/@grabreu/aduana): a lightweight, axios-style fetch client.

Read `README.md` before making changes — it documents the actual public API (`Why`, `Errors`, `Interceptors`, `Timeout & cancellation`).

## General Rules

- Keep changes scoped to the requested change.
- Prefer existing patterns over introducing new abstractions.
- Do not add dependencies unless they are necessary.
- Run formatting, linting, typecheck, build, and tests after changes.
- Do not change CI/CD configuration unless explicitly required.
- Do not claim a validation command passed unless it was actually run.

## Source

- `src/aduana.ts` - the `Aduana` class: `request`/`get`/`post`/`put`/`patch`/`delete`, the interceptor chain, timeout/abort handling.
- `src/interceptors.ts` - `InterceptorManager`, used for both the request and response chains.
- `src/errors.ts` - `HttpError`, RFC 7807 `ProblemDetails` helpers, `isTransientError`.
- `src/url.ts` - URL joining and query-string building.
- `src/types.ts` - public config/response types.
- `src/index.ts` - public exports, including the default singleton instance.

Every exported function/class should have a matching `*.test.ts` file.

## Validation

- `pnpm check` (Biome: format + lint + import sort)
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Git

Follow the conventions defined in `CONTRIBUTING.md` for branches, commits, and pull requests.

- Do not create or switch branches unless explicitly requested by the user.
- Do not create commits unless explicitly requested by the user.
- Do not push changes unless explicitly requested by the user.
- Keep commits focused on the requested change.

## Releases

Versioning, changelog, and npm publish are automated by [release-please](https://github.com/googleapis/release-please) — see `CONTRIBUTING.md` for how commit types map to version bumps. Do not hand-edit `version` in `package.json` or `.release-please-manifest.json`; release-please owns both after the initial `1.0.0` bootstrap.

## Documentation

Follow the documentation conventions below when creating or updating project documentation.

### Audience

Write for a developer evaluating whether to add this as a dependency.

Keep documentation concise and skimmable. Do not write onboarding tutorials unless explicitly requested.

### README Structure

`README.md` — badges, one-line description, install, `Why` (with a runnable example), `Errors`, `Interceptors`, `Timeout & cancellation`, `Development`, `License`.

Keep the existing README structure unless there is a clear reason to change it.

### Content Rules

- State facts concisely. Avoid unnecessary explanations or trailing rationale.
- Do not document information that is already obvious from the repository structure or configuration.
- Do not invent features, API shapes, or future direction.
- Document a capability only after it is implemented and verified.
- Use proper Markdown headings (`##`, `###`, etc.), not bold text as headings.
