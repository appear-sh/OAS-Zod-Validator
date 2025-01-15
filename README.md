# OAS-Zod-Validator

A robust OpenAPI 3.0 specification validator built with Zod, providing type-safe validation and detailed error messages.

## Features

- ✨ Complete OpenAPI 3.0.x specification validation
- 🔒 Type-safe schemas using Zod
- 🔍 Strict validation for:
  - Parameters (path, query, header, cookie)
  - Paths and path items
  - Request/response bodies
  - Components and schemas
  - Security schemes
- 🔗 Reference (`$ref`) tracking and validation
- 📝 Human-readable error messages

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

## Validation Details

### Path Validation
- Enforces leading forward slash
- Prevents query parameters in path definitions
- Ensures unique path parameters
- Validates HTTP methods and operations

### Component Validation
- Schema components
- Response components
- Parameter components
- Example components
- Request/response bodies
- Headers
- Security schemes
- Links and callbacks

### Reference Validation
- Internal reference resolution
- Reference tracking
- Circular reference detection

## Error Messages

The validator provides detailed error messages when validation fails:

```typescript
const invalidSpec = {
  // Missing required fields
  paths: {}
};

const result = validateOpenAPI(invalidSpec);
console.error(result.errors);
/* Output:
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

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a pull request

Please ensure you run tests before submitting PRs.

## License

[MIT](./LICENSE)