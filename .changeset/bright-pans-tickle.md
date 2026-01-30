---
'@appear.sh/oas-zod-validator': patch
---

Stop raising ERR_005 for schemas that imply type via properties, items, required, additionalProperties, or patternProperties (OpenAPI 3.x). Reduces false positives.
