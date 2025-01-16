# OAS-Zod-Validator

A robust OpenAPI Specification (OAS) validator built with Zod, providing type-safe validation for both OAS 3.0.x and 3.1 documents.

## Key Features

### Core Validation
- ✨ Full OpenAPI 3.0.x support
- 🆕 Partial OpenAPI 3.1 support (webhooks, jsonSchemaDialect)
- 🔒 Type-safe schemas using Zod
- 📝 Detailed, human-readable error messages

### Validation Coverage
- 🛣️ Paths & Operations
  - Leading slash enforcement
  - Unique parameter validation
  - HTTP method validation
  - Operation ID uniqueness
- 🧩 Components
  - Schemas (with nested type checking)
  - Parameters
  - Responses
  - Security Schemes
  - Examples
  - Headers
  - Links & Callbacks
- 🔗 References
  - Internal reference resolution
  - Reference tracking
  - Circular reference detection (in strict mode)

## Installation

```bash
npm install oas-zod-validator
# or
yarn add oas-zod-validator
```

## Quick Start

```typescript
import { validateOpenAPI } from 'oas-zod-validator';

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'My API',
    version: '1.0.0',
  },
  paths: {
    '/users': {
      get: {
        responses: {
          '200': {
            description: 'Success'
          }
        }
      }
    }
  }
};

const result = validateOpenAPI(spec);

if (result.valid) {
  console.log('✅ Valid OpenAPI specification');
  console.log('📎 Resolved references:', result.resolvedRefs);
} else {
  console.error('❌ Invalid specification:', result.errors);
}
```

## Validation Modes

### Standard Mode
By default, the validator enforces OAS 3.0.x rules strictly:
- Validates version string format
- Ensures all required fields are present
- Checks reference validity
- Enforces parameter uniqueness

### Relaxed Mode
For more flexible validation, especially useful for OAS 3.1 or draft specifications:

```typescript
const result = validateOpenAPI(spec, {
  strict: false,           // Relaxes certain validations
  allowFutureOASVersions: true // Allows OAS 3.1.x version strings
});
```

## OpenAPI 3.1 Support

Current 3.1 features supported:
- ✅ Top-level webhooks object
- ✅ jsonSchemaDialect field
- ✅ 3.1.x version strings
- ⚠️ Partial JSON Schema 2020-12 support

Example 3.1 validation:

```typescript
const spec31 = {
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
  jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
  webhooks: {
    '/onEvent': {
      post: {
        responses: { '200': { description: 'OK' } }
      }
    }
  }
};

const result = validateOpenAPI(spec31, { allowFutureOASVersions: true });
```

## Error Messages

The validator provides detailed error messages when validation fails:

```typescript
const invalidSpec = {
  // Missing required 'openapi' field
  paths: {}
};

const result = validateOpenAPI(invalidSpec);
if (!result.valid) {
  console.error(result.errors);
  /* Example output:
  {
    "issues": [{
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["openapi"],
      "message": "Required"
    }]
  }
  */
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Watch mode
npm run test:watch
```

## Contributing

Contributions are welcome! Please see our contributing guidelines for details.

## License

MIT