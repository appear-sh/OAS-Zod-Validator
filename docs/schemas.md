# Schema Validation Guide

## Overview

OAS-Zod-Validator provides comprehensive validation for OpenAPI schemas in both YAML and JSON formats. This guide covers schema validation rules, supported features, and best practices.

## Basic Types

### Primitive Types

```json
{
  "type": "string",
  "minLength": 1,
  "maxLength": 100
}
```

```yaml
type: number
minimum: 0
maximum: 100
format: float
```

### Objects

```json
{
  "type": "object",
  "required": ["id", "name"],
  "properties": {
    "id": {
      "type": "integer",
      "format": "int64"
    },
    "name": {
      "type": "string",
      "minLength": 1
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  }
}
```

### Arrays

```json
{
  "type": "array",
  "items": {
    "type": "string",
    "enum": ["pending", "active", "completed"]
  },
  "minItems": 1,
  "uniqueItems": true
}
```

## Schema References

### Using $ref

```json
{
  "components": {
    "schemas": {
      "Error": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer"
          },
          "message": {
            "type": "string"
          }
        }
      },
      "Response": {
        "type": "object",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/User"
          },
          "error": {
            "$ref": "#/components/schemas/Error"
          }
        }
      }
    }
  }
}
```

## Validation Rules

### Type-Specific Validation

Each type has its own set of valid properties:

- **Strings**

  - `minLength`, `maxLength`
  - `pattern` (regular expression)
  - `format` (email, date-time, etc.)

- **Numbers/Integers**

  - `minimum`, `maximum`
  - `exclusiveMinimum`, `exclusiveMaximum`
  - `multipleOf`
  - `format` (int32, int64, float, double)

- **Arrays**

  - `minItems`, `maxItems`
  - `uniqueItems`
  - `items` (required)

- **Objects**
  - `required`
  - `properties`
  - `additionalProperties`
  - `minProperties`, `maxProperties`

### Required Properties

Properties marked as required must be present:

```json
{
  "type": "object",
  "required": ["id", "name"],
  "properties": {
    "id": {
      "type": "integer"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    }
  }
}
```

## Best Practices

1. **Use Specific Types**

   - Prefer `integer` over `number` when appropriate
   - Use format specifiers for better type safety

2. **Schema Organization**

   - Keep reusable schemas in `components/schemas`
   - Use meaningful schema names
   - Group related schemas together

3. **Documentation**

   - Add descriptions to schemas and properties
   - Include examples
   - Document custom formats or patterns

4. **Validation Strategy**
   - Start with basic type validation
   - Add specific constraints
   - Use strict mode for additional checks

## Common Issues

### Invalid Type Combinations

```json
// ❌ Wrong
{
  "type": "string",
  "format": "int64"
}

// ✅ Correct
{
  "type": "integer",
  "format": "int64"
}
```

### Missing Required Properties

```json
// ❌ Wrong
{
  "type": "array"
}

// ✅ Correct
{
  "type": "array",
  "items": {
    "type": "string"
  }
}
```

### Invalid Property Usage

```json
// ❌ Wrong
{
  "type": "string",
  "properties": {
    "name": {
      "type": "string"
    }
  }
}

// ✅ Correct
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    }
  }
}
```

## Advanced Features

### Strict Mode

Enable strict mode for additional validations:

```typescript
const result = validateOpenAPI(spec, {
  strict: true,
  strictRules: {
    requireRateLimitHeaders: true,
  },
});
```

### Custom Formats

The validator supports all standard OpenAPI formats plus some additional ones:

```json
{
  "type": "string",
  "format": "email"
}
```

See [Format Support](./formats.md) for a complete list.
