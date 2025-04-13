# Format Support

## Overview

OAS-Zod-Validator supports all standard OpenAPI formats and provides strict validation for each. This document details the supported formats and their validation rules.

## String Formats

### Date & Time

| Format      | Description             | Example                | Validation               |
| ----------- | ----------------------- | ---------------------- | ------------------------ |
| `date-time` | ISO 8601 full date-time | `2024-02-14T15:30:00Z` | Full ISO 8601 compliance |
| `date`      | ISO 8601 date           | `2024-02-14`           | YYYY-MM-DD format        |
| `time`      | ISO 8601 time           | `15:30:00Z`            | HH:mm:ss[.SSS]Z format   |

### Network & Identity

| Format     | Description        | Example                                | Validation          |
| ---------- | ------------------ | -------------------------------------- | ------------------- |
| `email`    | Email address      | `user@example.com`                     | RFC 5322 compliance |
| `hostname` | Internet host name | `api.example.com`                      | RFC 1123 compliance |
| `ipv4`     | IPv4 address       | `192.168.1.1`                          | Valid IPv4 format   |
| `ipv6`     | IPv6 address       | `2001:db8::1`                          | Valid IPv6 format   |
| `uri`      | URI reference      | `https://api.example.com`              | RFC 3986 compliance |
| `uuid`     | UUID               | `123e4567-e89b-12d3-a456-426614174000` | RFC 4122 compliance |

### Data Encoding

| Format     | Description     | Example         | Validation            |
| ---------- | --------------- | --------------- | --------------------- |
| `byte`     | Base64 encoded  | `SGVsbG8=`      | Valid base64 encoding |
| `binary`   | Binary data     | `<binary data>` | Any binary content    |
| `password` | Password string | `secret123`     | No format validation  |

## Numeric Formats

### Integers

| Format  | Description    | Range           | Example               |
| ------- | -------------- | --------------- | --------------------- |
| `int32` | 32-bit integer | -2^31 to 2^31-1 | `2147483647`          |
| `int64` | 64-bit integer | -2^63 to 2^63-1 | `9223372036854775807` |

### Floating Point

| Format   | Description           | Precision          | Example             |
| -------- | --------------------- | ------------------ | ------------------- |
| `float`  | 32-bit floating point | ~7 decimal digits  | `3.14159`           |
| `double` | 64-bit floating point | ~15 decimal digits | `3.141592653589793` |

## Usage Examples

### String Format Validation

```json
{
  "type": "object",
  "properties": {
    "created": {
      "type": "string",
      "format": "date-time"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "website": {
      "type": "string",
      "format": "uri"
    }
  }
}
```

### Numeric Format Validation

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "format": "int64"
    },
    "price": {
      "type": "number",
      "format": "double"
    },
    "quantity": {
      "type": "integer",
      "format": "int32"
    }
  }
}
```

## Format Validation in Strict Mode

When using strict mode, format validation becomes more rigorous:

```typescript
const result = validateOpenAPI(spec, {
  strict: true,
});
```

In strict mode:

- All formats are strictly validated
- No unknown formats are allowed
- Format/type combinations are enforced

## Error Messages

Format validation errors provide clear messages:

```typescript
// Invalid email format
{
  "issues": [{
    "code": "invalid_string",
    "validation": "email",
    "message": "Invalid email format"
  }]
}

// Invalid integer format
{
  "issues": [{
    "code": "invalid_type",
    "expected": "integer",
    "message": "Expected integer, received float"
  }]
}
```

## Custom Format Support

While the validator focuses on standard OpenAPI formats, you can extend format support through custom validation:

```typescript
const customFormatValidator = (value: string) => {
  // Your custom validation logic
  return true;
};

// Use in validation options
const result = validateOpenAPI(spec, {
  customFormats: {
    'my-format': customFormatValidator,
  },
});
```

## Best Practices

1. **Choose Appropriate Formats**

   - Use specific formats when possible
   - Consider data size and precision requirements
   - Think about client-side parsing capabilities

2. **Validation Strategy**

   - Start with loose validation during development
   - Enable strict mode for production
   - Document format requirements clearly

3. **Error Handling**
   - Provide clear error messages
   - Include format requirements in API documentation
   - Consider providing format examples
