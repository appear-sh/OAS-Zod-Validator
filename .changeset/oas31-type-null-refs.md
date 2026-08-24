---
'@appear.sh/oas-zod-validator': minor
---

Improve OpenAPI 3.1 / JSON Schema 2020-12 conformance:

- Support `null` as a schema type, including nullable type arrays such as `"type": ["string", "null"]` and the standalone `"type": "null"` (previously these were rejected as invalid).
- Validate shared response components with the relaxed OAS 3.1 rules so schemas that omit `type`/composition keywords are accepted.
- Resolve `$ref` path parameters (e.g. `#/components/parameters/...`) when checking that every path-template placeholder is defined, fixing false "All path parameters in the URL must be defined in the parameters section" errors for specs that reuse shared parameters.
