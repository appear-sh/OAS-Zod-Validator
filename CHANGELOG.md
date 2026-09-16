# @appear.sh/oas-zod-validator

## 1.9.0

### Minor Changes

- 963d97c: Improve OpenAPI 3.1 / JSON Schema 2020-12 conformance:

  - Support `null` as a schema type, including nullable type arrays such as `"type": ["string", "null"]` and the standalone `"type": "null"` (previously these were rejected as invalid).
  - Validate shared response, parameter, request-body, and header components with the relaxed OAS 3.1 rules so schemas that use nullable type arrays or omit `type`/composition keywords are accepted.
  - Resolve `$ref` path parameters (e.g. `#/components/parameters/...`) when checking that every path-template placeholder is defined, fixing false "All path parameters in the URL must be defined in the parameters section" errors for specs that reuse shared parameters.

### Patch Changes

- ed86d10: Modernise dependencies and tidy the toolchain.

  - **Runtime deps:** bump `zod` `^4.0.0` → `^4.4.3`, `yaml` `^2.7.1` → `^2.9.0` (fixes the `yaml` stack-overflow DoS advisory), and `inquirer` `^9.2.16` → `^9.3.8` (drops the vulnerable `external-editor` → `tmp`/`shell-quote` chain).
  - **Dev tooling:** move to `vitest` 4 + `@vitest/coverage-v8` 4, `eslint` 9.39, `@typescript-eslint` 8.67, Prettier 3.9, `tsup` 8.5, and `@changesets/cli` 3. Clears the toolchain's high/critical npm audit advisories (now 0 criticals, 0 moderates).
  - **Housekeeping:** remove a dead duplicate `verifyRefTargets` module and duplicate `ValidationOptions`/`ValidationResult` type declarations, drop the broken `update-tests` script and unused `ts-node`/`@types/lodash*` dev deps, and recalibrate the Vitest branch-coverage threshold to match the v4 instrumenter.

  No public API changes.

## 1.8.2

### Patch Changes

- dba86de: Stop raising ERR_005 for schemas that imply type via properties, items, required, additionalProperties, or patternProperties (OpenAPI 3.x). Reduces false positives.

## 1.8.1

### Patch Changes

- 43ab340: Enhanced error properties now included on all ZodError issues automatically.

  **No breaking changes** — existing code continues to work. Each issue now includes:

  - `errorCode` — standardized code (e.g., "ERR_006")
  - `suggestion` — actionable fix guidance
  - `specLink` — link to relevant OpenAPI spec section
  - `category` — error category ("schema", "format", etc.)
  - `severity` — "error" or "warning"

  **CLI:** Already displays these ✨

  **Programmatic API:** Properties available on each issue:

  ```typescript
  result.errors.issues.forEach((issue) => {
    console.log(issue.errorCode); // "ERR_006"
    console.log(issue.suggestion); // "Add properties..."
    console.log(issue.specLink); // "https://appear.sh/..."
  });
  ```

  New exported types: `EnhancedZodIssue`, `EnhancedIssueProperties`

## 1.8.0

### Minor Changes

- e2f6879: ### Improved Error Codes & OAS 3.0 Composition Support

  **New Error Codes with Actionable Suggestions:**

  - `ERR_006` MISSING_OBJECT_SCHEMA — "Add `properties` or `additionalProperties`"
  - `ERR_007` MISSING_ARRAY_ITEMS — "Add `items` to define array elements"
  - `ERR_008` TYPE_KEYWORD_MISMATCH — "Check keyword compatible with type"
  - `ERR_009` INVALID_EXAMPLE_VALUE — "Update example to match constraints"

  **OAS 3.0 Composition Keywords:**

  - Added `anyOf`, `oneOf`, `allOf`, `not` support to OAS 3.0 Schema Object
  - Previously these were only supported in OAS 3.1, causing false-positive errors

  **Bug Fixes:**

  - Empty composition arrays (`oneOf: []`) now correctly rejected
  - Type validations (items/properties) properly skip when composition present
  - Example validation runs correctly for schemas with both type and composition
  - Narrowed example error matching to avoid false positives

## 1.7.0

### Minor Changes

- 8069657: Enhanced error reporting with error codes, suggestions, and spec links

  ### New Features
  - **Standardised error codes** (ERR_001-ERR_999) for programmatic handling across categories: schema, format, reference, pattern, numeric, strict mode, API patterns, and version/parsing
  - **New `validateOpenAPIEnhanced()` function** returns rich error metadata including codes, categories, severity, suggestions, spec links, and summary statistics
  - **Actionable suggestions** for every error type to help developers fix issues faster
  - **Direct spec links** to [Appear Specs Hub](https://appear.sh/api-toolkit/specs) with enhanced UX (AI chat, notes, better navigation)
  - **Improved CLI output** with error codes, colour-coded severity, suggestions, and spec links

  ### New Exports
  - `validateOpenAPIEnhanced()` - Enhanced validation with detailed error information
  - `ValidationErrorCode` - Error code enumeration
  - `ERROR_CODES` - Error code metadata map
  - `getErrorCodeInfo()` - Utility to retrieve error code information
  - `EnhancedValidationResult` - Type for enhanced validation results

  ### Example

  ```typescript
  import { validateOpenAPIEnhanced } from '@appear.sh/oas-zod-validator';

  const result = validateOpenAPIEnhanced(spec);
  if (!result.valid) {
    for (const issue of result.errors.issues) {
      console.log(`[${issue.code}] ${issue.message}`);
      console.log(`  Fix: ${issue.suggestion}`);
      console.log(`  Spec: ${issue.specLink}`);
    }
  }
  ```

## 1.6.1

### Patch Changes

- 0ba3403: Fix false positives in OAS 3.1 validation and improve error messages

## 1.6.0

### Minor Changes

- 25531c8: Added support for 3.2 and enforced 3.1 boundaries

## 1.5.2

### Patch Changes

- ea6113c: Fix issue #24 - support for union types

## 1.5.1

### Patch Changes

- 81681be: Better handling for larger specs

## 1.5.0

### Minor Changes

- 44d121d: Added Zod4 support, query method allowed, $ref path validation

## 1.4.0

### Minor Changes

- 9fb9d50: Significantly improves strict mode by adding and refining several key uniqueness validations as per OpenAPI Specification requirements

## 1.3.0

### Minor Changes

- 15251ca: overhaul build process with tsup for iproved esm/cjs output and bundler compatibility for NextJS and Vite

## 1.2.0

### Minor Changes

- f4e771c: Added source mapping functionality for errors in both CLI and programmatic usage.

## 1.1.1

### Patch Changes

- 8ff43bf: Added assets to files field in package json

## 1.1.0

### Minor Changes

- 2cdb3b9: Added spec integration tests in CLI and added numerous minor fixes, along with updates to the readme including npx usage

### Patch Changes

- 0922af7: update unit tests to expect new error message for invalid spec version or missing version
