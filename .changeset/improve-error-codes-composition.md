---
"@appear.sh/oas-zod-validator": minor
---

### Improved Error Codes & OAS 3.0 Composition Support

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
