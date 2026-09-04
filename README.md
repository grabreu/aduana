# aduana

[![CI](https://github.com/grabreu/aduana/actions/workflows/ci.yml/badge.svg)](https://github.com/grabreu/aduana/actions/workflows/ci.yml)
[![CD](https://github.com/grabreu/aduana/actions/workflows/cd.yml/badge.svg)](https://github.com/grabreu/aduana/actions/workflows/cd.yml)
[![npm](https://img.shields.io/npm/v/%40grabreu%2Faduana.svg?style=flat-square&logo=npm&label=%40grabreu%2Faduana)](https://www.npmjs.com/package/@grabreu/aduana)
[![License](https://img.shields.io/github/license/grabreu/aduana?style=flat-square)](LICENSE)

A lightweight, type-safe fetch client for JavaScript/TypeScript.

```bash
npm install @grabreu/aduana
```

> **Status:** ainda em setup — a implementação da lib vem a seguir. Essa seção vai virar "Why" / exemplos de uso quando a API existir.

## Development

```bash
pnpm install
pnpm dev         # build em watch mode
pnpm build       # build de produção (ESM + CJS + types)
pnpm test        # testes
pnpm typecheck
pnpm lint
```

Releases (versionamento, changelog e publicação no npm) são automatizadas via [release-please](https://github.com/googleapis/release-please) na CD.

## License

Licensed under the [MIT License](LICENSE).
