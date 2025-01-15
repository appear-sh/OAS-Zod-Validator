# OAS-Zod-Validator

A robust OpenAPI 3.0+ specification validator built with Zod, providing type-safe validation and detailed error messages. It can validate typical OAS 3.0.x documents out of the box, with optional support for broader (3.1) usage.

## Features

- ✨ Complete OpenAPI 3.0.x (and partial 3.1) specification validation
- 🔒 Type-safe schemas using Zod
- 🔍 Strict validation for:
  - Parameters (path, query, header, cookie)
  - Paths and path items (leading slash, no duplicate parameters, etc.)
  - Request/response bodies
  - Components and schemas
  - Security schemes
- 🔗 Reference ($ref) tracking and validation
- ⚙️ Optional configuration for relaxed validation
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
- Schema components (with detailed checks for array/object structure)
- Response components
- Parameter components
- Example components
- Request/response bodies
- Headers
- Security schemes (e.g., HTTP bearer, API keys)
- Links and callbacks

### Reference Validation
- Internal reference resolution
- Reference tracking and error reporting
- Circular reference detection

## Error Messages

The validator provides detailed error messages when validation fails. For example:

```typescript
const invalidSpec = {
  // Missing the required 'openapi' field
  paths: {}
};

const result = validateOpenAPI(invalidSpec);

if (!result.valid) {
  console.error(result.errors);
  /* 
    Example output:
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

## Advanced Usage

If you need to allow partial or relaxed validations, you can pass additional options to the validator. For example:

```typescript
import { validateOpenAPI } from 'oas-zod-validator';

const spec = {
  /* Your OAS here */
};

const result = validateOpenAPI(spec, {
  strict: false,           // Skips or relaxes certain validations
  allowFutureOASVersions: true // Allows a broader range of OAS version strings
});

if (result.valid) {
  console.log('Valid specification (with relaxed rules)!');
} else {
  console.error('Invalid specification:', result.errors);
}
```

Use these flags if you anticipate user-submitted specifications that might have minor deviations from strict 3.0 or if you need to test early OAS 3.1 features.

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

1. Fork the repository.  
2. Create a new branch for your feature or bugfix.  
3. Commit and push your changes.  
4. Submit a pull request.

## License

Licensed under the MIT license. See the [LICENSE](../LICENSE) file for details.