# Error Reference

## Overview

OAS-Zod-Validator provides detailed error messages with error codes, fix suggestions, and links to the OpenAPI specification to help you quickly identify and fix issues in your OpenAPI specifications.

## Error Codes

All validation errors include an error code for programmatic handling:

| Code      | Category    | Description                            |
| --------- | ----------- | -------------------------------------- |
| `ERR_001` | schema      | Invalid type                           |
| `ERR_002` | schema      | Required field is missing              |
| `ERR_003` | schema      | Unrecognized keys detected             |
| `ERR_004` | schema      | Value does not match any expected type |
| `ERR_005` | schema      | Custom validation failed               |
| `ERR_101` | format      | Invalid format                         |
| `ERR_102` | format      | Format is not valid for the type       |
| `ERR_103` | format      | Invalid date-time format               |
| `ERR_104` | format      | Invalid email format                   |
| `ERR_105` | format      | Invalid URI format                     |
| `ERR_106` | format      | Invalid UUID format                    |
| `ERR_107` | format      | Invalid hostname format                |
| `ERR_108` | format      | Invalid IPv4 address format            |
| `ERR_109` | format      | Invalid IPv6 address format            |
| `ERR_201` | reference   | Invalid reference format               |
| `ERR_202` | reference   | Reference not found                    |
| `ERR_203` | reference   | Circular reference detected            |
| `ERR_204` | reference   | Invalid JSON pointer in reference      |
| `ERR_301` | pattern     | Invalid regular expression             |
| `ERR_302` | pattern     | Failed to compile regular expression   |
| `ERR_303` | pattern     | Pattern validation failed              |
| `ERR_401` | numeric     | Value is below minimum                 |
| `ERR_402` | numeric     | Value exceeds maximum                  |
| `ERR_403` | numeric     | String is too short                    |
| `ERR_404` | numeric     | String is too long                     |
| `ERR_405` | numeric     | Value must be greater than minimum     |
| `ERR_406` | numeric     | Value must be less than maximum        |
| `ERR_407` | numeric     | Value is not a multiple                |
| `ERR_501` | strict      | Duplicate operationId                  |
| `ERR_502` | strict      | Ambiguous path template                |
| `ERR_503` | strict      | Duplicate tag name                     |
| `ERR_504` | strict      | Rate limit headers are required        |
| `ERR_505` | strict      | Duplicate parameter                    |
| `ERR_601` | api_pattern | Invalid bulk request schema            |
| `ERR_602` | api_pattern | Invalid pagination configuration       |
| `ERR_701` | version     | Unsupported OpenAPI version            |
| `ERR_702` | version     | Invalid version format                 |

## Enhanced Error Structure

### Standard Validation Result

```typescript
interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError;
  resolvedRefs: string[];
}
```

### Enhanced Validation Result (New)

For more detailed error information, use `validateOpenAPIEnhanced`:

```typescript
interface EnhancedValidationResult {
  valid: boolean;
  summary?: {
    errors: number;
    warnings: number;
    byCategory: Record<string, number>;
    byCode: Record<string, number>;
  };
  errors?: {
    issues: Array<{
      code: string; // ERR_XXX code
      category: string; // 'schema', 'format', 'reference', etc.
      severity: 'error' | 'warning';
      message: string; // Enhanced message
      suggestion?: string; // Fix suggestion
      specLink?: string; // Link to OAS spec
      path: (string | number)[];
      expected?: unknown;
      received?: unknown;
    }>;
  };
  resolvedRefs: string[];
}
```

## Using Enhanced Validation

```typescript
import { validateOpenAPIEnhanced } from '@appear.sh/oas-zod-validator';

const result = validateOpenAPIEnhanced(spec);

if (!result.valid) {
  console.log(`Found ${result.summary?.errors} errors`);
  console.log(`Found ${result.summary?.warnings} warnings`);

  result.errors?.issues.forEach((issue) => {
    console.log(`[${issue.code}] ${issue.message}`);
    if (issue.suggestion) {
      console.log(`Suggestion: ${issue.suggestion}`);
    }
    if (issue.specLink) {
      console.log(`Spec: ${issue.specLink}`);
    }
  });
}
```

## CLI Output

The CLI now includes error codes and suggestions:

```
✗ Validation found 2 error(s) and 1 warning(s):

• [ERR_002] info.contact L3
  Error: Required field is missing
  💡 Suggestion: Add contact information for API consumers
  📖 Spec: https://spec.openapis.org/oas/v3.1.0#info-object

▲ [DOC001] paths./users.get.description L15
  Warning: Operation description is recommended
  💡 Add a description for better API documentation
```

## JSON Output

```json
{
  "valid": false,
  "summary": {
    "errors": 2,
    "warnings": 1,
    "byCategory": {
      "schema": 1,
      "documentation": 1
    },
    "byCode": {
      "ERR_002": 1
    }
  },
  "errors": {
    "issues": [
      {
        "code": "ERR_002",
        "category": "schema",
        "severity": "error",
        "message": "Required field is missing",
        "suggestion": "Add contact information for API consumers",
        "specLink": "https://spec.openapis.org/oas/v3.1.0#info-object",
        "path": ["info", "contact"]
      }
    ]
  }
}
```

## Common Error Types

### Type Errors

```json
{
  "issues": [
    {
      "code": "ERR_001",
      "category": "schema",
      "message": "Invalid type",
      "expected": "string",
      "received": "number",
      "path": ["info", "title"],
      "suggestion": "Expected string, received number. Check the field type."
    }
  ]
}
```

### Required Field Errors

```json
{
  "issues": [
    {
      "code": "ERR_002",
      "category": "schema",
      "message": "Required field is missing",
      "path": ["info", "contact"],
      "suggestion": "Add contact information for API consumers"
    }
  ]
}
```

### Format Errors

```json
{
  "issues": [
    {
      "code": "ERR_104",
      "category": "format",
      "message": "Invalid email format",
      "path": ["components", "schemas", "User", "properties", "email"],
      "suggestion": "Use a valid email address format like \"user@example.com\""
    }
  ]
}
```

### Reference Errors

```json
{
  "issues": [
    {
      "code": "ERR_202",
      "category": "reference",
      "message": "Reference not found",
      "path": ["components", "schemas", "User", "properties", "role"],
      "suggestion": "Ensure the referenced component exists in your OpenAPI document"
    }
  ]
}
```

## Error Categories

### 1. Schema Validation Errors

- Type mismatches (`ERR_001`)
- Missing required fields (`ERR_002`)
- Invalid unions (`ERR_004`)

### 2. Reference Errors

- Invalid references (`ERR_201`)
- Missing references (`ERR_202`)
- Circular references (`ERR_203`)

### 3. Format Validation Errors

- Invalid date-time formats (`ERR_103`)
- Invalid email formats (`ERR_104`)
- Invalid URI formats (`ERR_105`)

### 4. Strict Mode Errors

- Duplicate operationIds (`ERR_501`)
- Ambiguous paths (`ERR_502`)
- Missing rate limit headers (`ERR_504`)

## Best Practices

### 1. Error Prevention

- Use TypeScript for static type checking
- Follow OpenAPI best practices
- Use schema validation during development

### 2. Error Handling

- Use `validateOpenAPIEnhanced` for detailed error information
- Log validation errors with full context
- Provide clear error messages to users

### 3. Debugging

- Check the error path carefully
- Follow the spec link for specification details
- Use the suggestion to fix common issues

## Integration with Error Tracking

```typescript
import { validateOpenAPIEnhanced } from '@appear.sh/oas-zod-validator';
import * as Sentry from '@sentry/node';

const result = validateOpenAPIEnhanced(spec);
if (!result.valid) {
  result.errors?.issues.forEach((issue) => {
    Sentry.captureEvent({
      message: issue.message,
      extra: {
        code: issue.code,
        category: issue.category,
        path: issue.path,
        suggestion: issue.suggestion,
        specLink: issue.specLink,
      },
    });
  });
}
```
