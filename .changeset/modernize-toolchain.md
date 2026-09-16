---
'@appear.sh/oas-zod-validator': patch
---

Modernise dependencies and tidy the toolchain.

- **Runtime deps:** bump `zod` `^4.0.0` → `^4.4.3`, `yaml` `^2.7.1` → `^2.9.0` (fixes the `yaml` stack-overflow DoS advisory), and `inquirer` `^9.2.16` → `^9.3.8` (drops the vulnerable `external-editor` → `tmp`/`shell-quote` chain).
- **Dev tooling:** move to `vitest` 4 + `@vitest/coverage-v8` 4, `eslint` 9.39, `@typescript-eslint` 8.67, Prettier 3.9, `tsup` 8.5, and `@changesets/cli` 3. Clears the toolchain's high/critical npm audit advisories (now 0 criticals, 0 moderates).
- **Housekeeping:** remove a dead duplicate `verifyRefTargets` module and duplicate `ValidationOptions`/`ValidationResult` type declarations, drop the broken `update-tests` script and unused `ts-node`/`@types/lodash*` dev deps, and recalibrate the Vitest branch-coverage threshold to match the v4 instrumenter.

No public API changes.
