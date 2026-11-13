# Contributing to Paper Surgery

Useful contributions include a minimal reproducible input, a failing regression test, clearer documentation, or a focused feature improvement. Use synthetic or redacted data.

## Develop

Install Node.js 24 and npm. Fork and clone the repository, then run `npm ci` and `npm run dev`. Run `npm run typecheck`, `npm test`, and `npm run build` before submitting a pull request. Browser verification is described in [Development](docs/DEVELOPMENT.md).

Keep pull requests focused, explain the observable behavior, add tests for consequential edge cases, and update the relevant format/user documentation. Preserve local processing and distinguish heuristics from confirmed facts. Do not add telemetry, remote processing, or third-party assets without documenting the data flow and license.

## Review and conduct

Open an issue before a large architectural change. Contributions are reviewed for correctness, accessibility, privacy, and maintainability. Participate under the [Code of Conduct](CODE_OF_CONDUCT.md). Contributions are licensed under the repository's MIT license.
