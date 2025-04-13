# Validation Options

## Overview

OAS-Zod-Validator provides flexible validation options to suit different use cases, from development to production environments.

## Basic Options

```typescript
interface ValidationOptions {
  strict?: boolean;
  allowFutureOASVersions?: boolean;
  strictRules?: {
    requireRateLimitHeaders?: boolean;
  };
  customFormats?: Record<string, (value: string) => boolean>;
}
```

### Strict Mode

Enables additional validations:

```typescript
const result = validateOpenAPI(spec, {
  strict: true,
});
```

Strict mode enforces:

- Format validation
- Required fields
- Type compatibility
- Reference resolution
- Pattern validation

### Version Support

Control OpenAPI version validation:

```typescript
// Allow future 3.x versions
const result = validateOpenAPI(spec, {
  allowFutureOASVersions: true,
});
```

### Rate Limiting

Enforce rate limit headers:

```typescript
const result = validateOpenAPI(spec, {
  strict: true,
  strictRules: {
    requireRateLimitHeaders: true,
  },
});
```

## Validation Result

The validation result includes:

```typescript
interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError;
  resolvedRefs: string[];
}
```

Example usage:

```typescript
const result = validateOpenAPI(spec);

if (result.valid) {
  console.log('✅ Valid OpenAPI specification');
  console.log('📎 Resolved references:', result.resolvedRefs);
} else {
  console.error('❌ Validation errors:', result.errors);
}
```

## Error Handling

Validation errors are returned as Zod errors:

```typescript
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

## Advanced Usage

### Custom Format Validation

Add custom format validators:

```typescript
const phoneValidator = (value: string) => {
  return /^\+[1-9]\d{1,14}$/.test(value);
};

const result = validateOpenAPI(spec, {
  customFormats: {
    phone: phoneValidator,
  },
});
```

### Combining Options

Multiple options can be combined:

```typescript
const result = validateOpenAPI(spec, {
  strict: true,
  allowFutureOASVersions: true,
  strictRules: {
    requireRateLimitHeaders: true,
  },
  customFormats: {
    phone: phoneValidator,
  },
});
```

## Best Practices

1. **Development vs Production**

   - Use loose validation during development
   - Enable strict mode in production
   - Always validate references

2. **Error Handling**

   - Handle validation errors gracefully
   - Provide clear error messages
   - Log validation failures

3. **Performance**
   - Cache validation results when possible
   - Use strict mode selectively
   - Consider the impact of custom validators

## CLI Options

The CLI supports all validation options:

```bash
# Enable strict mode
oas-validate --strict api.yaml

# Allow future versions
oas-validate --future api.yaml

# Require rate limit headers
oas-validate --strict --rate-limits api.yaml

# JSON output
oas-validate --json api.yaml
```

## Configuration File

Create `.oas-validate.json` for persistent options:

```json
{
  "strict": true,
  "allowFutureOASVersions": false,
  "requireRateLimitHeaders": true,
  "format": "pretty"
}
```

## Environment Variables

Options can be set via environment variables:

```bash
export OAS_VALIDATE_STRICT=true
export OAS_VALIDATE_RATE_LIMITS=true
```

## Integration Examples

### GitHub Actions

```yaml
name: Validate OpenAPI Spec
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g oas-zod-validator
      - run: oas-validate --strict api.yaml
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

oas-validate --strict api.yaml
if [ $? -ne 0 ]; then
  echo "❌ OpenAPI validation failed"
  exit 1
fi
```
