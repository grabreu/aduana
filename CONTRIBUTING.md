# Contributing

This is a personal project, but contributions are welcome.

## Commits

Format: `type: summary` ([Conventional Commits](https://www.conventionalcommits.org/)).

- **type** — `feat`, `fix`, `docs`, `chore`, `ci`, `refactor`, `test`, `build`, `perf`
- **body** — optional. Add one only when the commit carries a reason, trade-off, or constraint that isn't obvious from the title or diff. Skip it otherwise.

The type matters here: [release-please](https://github.com/googleapis/release-please) reads it to compute the next version. `feat` bumps minor, `fix` bumps patch, a `!` after the type (or a `BREAKING CHANGE:` footer) bumps major, and everything else (`chore`, `docs`, `ci`, `test`, ...) does not trigger a release.

Keep commits focused — avoid mixing unrelated changes.

## Branches

`type/short-description`.

Examples: `feat/retry-interceptor`, `fix/timeout-abort-race`

## Pull requests

- All changes land on `main` through a PR — no direct pushes.
- Squash merge only; the PR title becomes the commit title.
- No required approvals (single maintainer), but CI checks must pass before merging.
