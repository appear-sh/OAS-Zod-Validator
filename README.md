# OAS-Zod-Validator Documentation

## Overview
A robust OpenAPI Specification (OAS) validator built with Zod, providing type-safe validation for both OAS 3.0.x and 3.1 documents with enterprise-grade pattern validation.

## Installation

```bash
npm install oas-zod-validator (not yet published)
```


## Core Features

### Validation Support
- Full OpenAPI 3.0.x support
- Partial OpenAPI 3.1 support
- Type-safe schemas using Zod
- Detailed error messages
- Rate limiting validation
- Pagination pattern validation
- Bulk operations validation

### Enterprise Features
- Reference resolution & circular detection
- Strict mode validation
- Documentation requirements
- Security scheme validation

## Usage Examples


### Testing the validator
open the spec-tester.ts file and include the spec you wish to test with its location. Once you have done this, run the following from the project root:
```
npx ts-node src/utils/spec-tester.ts
```


### Basic Validation

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


### Strict Validation

```typescript
const result = validateOpenAPI(spec, {
  strict: true,
  strictRules: {
    requireRateLimitHeaders: true
  }
});
```


### OpenAPI 3.1 Support

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


## Validation Options

Reference to validation options interface:

```typescript
export interface ValidationOptions {
  strict?: boolean;
  allowFutureOASVersions?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError;
  resolvedRefs: string[];
}
```


## Error Handling

The validator provides detailed error messages:

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


## Development (not yet published)

```bash
# Install dependencies
npm install

# Run tests
npm test

# Watch mode
npm run test:watch

# Build
npm run build
```


## Testing Coverage (not yet published) 

For test examples and coverage, see:

```typescript
describe('OpenAPI Version Detection', () => {
  test('handles future 3.x versions with allowFutureOASVersions', () => {
    const futureSpec = {
      openapi: '3.2.0',
      info: { title: 'Future API', version: '1.0.0' },
      paths: {}
    };

    const result = validateOpenAPI(futureSpec, { allowFutureOASVersions: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('rejects future versions without allowFutureOASVersions', () => {
    const futureSpec = {
      openapi: '3.2.0',
      info: { title: 'Future API', version: '1.0.0' },
      paths: {}
    };

    const result = validateOpenAPI(futureSpec);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('rejects invalid document formats', () => {
    expect(validateOpenAPI(null).valid).toBe(false);
    expect(validateOpenAPI(undefined).valid).toBe(false);
    expect(validateOpenAPI({}).valid).toBe(false);
    expect(validateOpenAPI({ openapi: 123 }).valid).toBe(false);
  });
});
```

## Contributing
Contributions are welcome! 

For implementation details of the core validator, see:

```typescript
export function validateOpenAPI(
  document: unknown,
  options: ValidationOptions = {}
): ValidationResult {
  const resolvedRefs: string[] = [];
  
  try {
    const docAsObject = document as Record<string, unknown>;
    let parsed: OpenAPISpec;

    const parseParams = {
      path: [],
      errorMap: createErrorMap(options),
      data: { 
        strict: options.strict,
        strictRules: options.strictRules 
      }
    };

    if (options.allowFutureOASVersions && typeof docAsObject.openapi === 'string' && docAsObject.openapi.startsWith('3.')) {
      parsed = OpenAPIObject31.parse(docAsObject, parseParams);
    } else {
      const version = detectOpenAPIVersion(docAsObject);
      if (version === '3.1') {
        parsed = OpenAPIObject31.parse(docAsObject, parseParams);
      } else {
        parsed = OpenAPIObject.parse(docAsObject, parseParams);
      }
    }

    if (options.strict) {
      verifyRefTargets(parsed, resolvedRefs);
      
      const apiPatternsError = validateAPIPatterns(parsed);
      if (apiPatternsError) {
        return { valid: false, errors: apiPatternsError, resolvedRefs };
      }

      if (options.strictRules?.requireRateLimitHeaders) {
        const rateLimitError = validateRateLimitHeaders(parsed, options);
        if (rateLimitError) {
          return { valid: false, errors: rateLimitError, resolvedRefs };
        }
      }
    }

    return { valid: true, resolvedRefs };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error, resolvedRefs };
    }
    return { valid: false, errors: new z.ZodError([{ 
      code: z.ZodIssueCode.custom,
      path: [],
      message: error instanceof Error ? error.message : 'Unknown error'
    }]), resolvedRefs };
  }
}
```

## License
MIT