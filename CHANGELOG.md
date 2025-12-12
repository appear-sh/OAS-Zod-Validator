# @appear.sh/oas-zod-validator

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
