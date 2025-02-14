# Error Reference

## Overview

OAS-Zod-Validator provides detailed error messages to help you quickly identify and fix issues in your OpenAPI specifications.

## Error Structure

All validation errors follow this structure:

```typescript
interface ValidationError {
  issues: Array<{
    code: z.ZodIssueCode;
    path: (string | number)[];
    message: string;
    expected?: string;
    received?: string;
  }>;
}
```

## Common Error Types

### Type Errors

```json
{
  "issues": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["info", "title"],
      "message": "Expected string, received number"
    }
  ]
}
```

### Required Field Errors

```json
{
  "issues": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["openapi"],
      "message": "Required"
    }
  ]
}
```

### Format Errors

```json
{
  "issues": [
    {
      "code": "invalid_string",
      "validation": "email",
      "path": [
        "paths",
        "/users",
        "post",
        "requestBody",
        "content",
        "application/json",
        "schema",
        "properties",
        "email"
      ],
      "message": "Invalid email format"
    }
  ]
}
```

### Reference Errors

```json
{
  "issues": [
    {
      "code": "custom",
      "path": ["components", "schemas", "User", "properties", "role"],
      "message": "Invalid reference: #/components/schemas/Role does not exist"
    }
  ]
}
```

## Error Categories

### 1. Schema Validation Errors

- Type mismatches
- Missing required fields
- Invalid formats
- Pattern validation failures
- Range validation failures

### 2. Reference Errors

- Invalid references
- Circular references
- Missing references
- Reference resolution failures

### 3. Format Validation Errors

- Invalid date-time formats
- Invalid email formats
- Invalid URI formats
- Invalid numeric formats

### 4. Strict Mode Errors

- Missing rate limit headers
- Invalid pattern usage
- Undocumented responses
- Security requirement issues

## Error Resolution Guide

### Type Errors

```yaml
# ❌ Error
info:
  title: 123  # Type error: number instead of string

# ✅ Fix
info:
  title: "My API"  # Correct: string value
```

### Required Fields

```yaml
# ❌ Error
paths:
  /users:
    get:
      # Missing required 'responses' field

# ✅ Fix
paths:
  /users:
    get:
      responses:
        '200':
          description: "Success"
```

### Format Validation

```yaml
# ❌ Error
components:
  schemas:
    User:
      properties:
        email:
          type: string
          format: email
          example: "not-an-email"  # Invalid email format

# ✅ Fix
components:
  schemas:
    User:
      properties:
        email:
          type: string
          format: email
          example: "user@example.com"  # Valid email format
```

## Best Practices

1. **Error Prevention**

   - Use TypeScript for static type checking
   - Follow OpenAPI best practices
   - Use schema validation during development

2. **Error Handling**

   - Log validation errors with context
   - Provide clear error messages to users
   - Include resolution steps in error messages

3. **Debugging**
   - Check the error path carefully
   - Validate against the OpenAPI spec
   - Use the CLI's verbose mode for details

## CLI Error Output

The CLI provides formatted error output:

```bash
❌ Validation failed:

• info.title
  Expected string, received number

• paths./users.get.responses
  Required

• components.schemas.User.properties.email
  Invalid email format
```

## Error Reporting

Enable detailed error reporting:

```typescript
const result = validateOpenAPI(spec, {
  errorReporting: {
    detailed: true,
    includeData: true,
  },
});
```

## Common Solutions

### 1. Schema Issues

```yaml
# Problem: Invalid type
type: string
minimum: 0  # Error: numeric validation on string

# Solution: Correct type
type: number
minimum: 0
```

### 2. Reference Issues

```yaml
# Problem: Invalid reference
$ref: "#/components/schema/User"  # Wrong path

# Solution: Correct path
$ref: "#/components/schemas/User"  # Note: schemas (plural)
```

### 3. Format Issues

```yaml
# Problem: Wrong format
type: string
format: datetime  # Wrong format name

# Solution: Correct format
type: string
format: date-time  # Correct format name
```

## Integration with Error Tracking

Example with error tracking service:

```typescript
import * as Sentry from "@sentry/node";

try {
  const result = validateOpenAPI(spec);
  if (!result.valid) {
    Sentry.captureException(new Error("OpenAPI Validation Failed"), {
      extra: {
        errors: result.errors,
      },
    });
  }
} catch (error) {
  Sentry.captureException(error);
}
```
