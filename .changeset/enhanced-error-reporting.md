---
"@appear.sh/oas-zod-validator": minor
---

Enhanced error reporting with error codes, suggestions, and spec links

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
