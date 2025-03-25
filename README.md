# OAS Zod Validator

A robust OpenAPI Specification (OAS) validator built with Zod, providing type-safe schema validation for both OAS 3.0.x and 3.1 specifications.

[![npm version](https://badge.fury.io/js/oas-zod-validator.svg)](https://badge.fury.io/js/oas-zod-validator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Full OpenAPI 3.0.x and 3.1 support
- Type-safe validation using Zod
- Detailed error messages with path information
- Zero external runtime dependencies
- Enterprise-ready with strict mode validation
- Supports both YAML and JSON formats
- Interactive CLI with rich reporting
- Comprehensive numeric format validations
- Rate limit header enforcement options
- Custom format validators
- Performance optimization with caching for large schemas

## Installation

```bash
npm install oas-zod-validator
```

## Quick Start

```typescript
import { validateOpenAPI } from "oas-zod-validator";

// Validate an OpenAPI spec (JSON or YAML)
const result = validateOpenAPI({
  openapi: "3.0.0",
  info: {
    title: "My API",
    version: "1.0.0",
  },
  paths: {
    "/hello": {
      get: {
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
  },
});

if (result.valid) {
  console.log("✅ Valid OpenAPI specification");
} else {
  console.error("❌ Validation errors:", result.errors);
}
```

## CLI Usage

```bash
# Install globally
npm install -g oas-zod-validator

# Validate a spec file
oas-validate api.yaml

# With strict validation options
oas-validate --strict --rate-limits api.json

# Interactive mode with guidance
oas-validate --interactive

# JSON output for CI/CD pipelines
oas-validate --json api.yaml
```

## Advanced Usage

### Performance Optimization with Caching

Caching is enabled by default and significantly improves performance for repeated validations of the same specification:

```typescript
// Validate with default caching (enabled)
const result = validateOpenAPI(spec);

// Disable caching if needed
const resultNoCache = validateOpenAPI(spec, {
  cache: { enabled: false },
});

// Configure cache size
const resultWithLargeCache = validateOpenAPI(spec, {
  cache: { maxSize: 1000 },
});

// Reset the cache manually
import { resetCache } from "oas-zod-validator";
resetCache();

// Configure the global cache
import { configureCache } from "oas-zod-validator";
configureCache({ maxSize: 2000 });
```

The caching system optimizes:

- OpenAPI document validation
- YAML/JSON parsing
- Reference resolution

This is particularly beneficial for:

- Large API specifications
- CI/CD pipelines with repeated validations
- Development workflows with incremental changes

### Custom Format Validation

```typescript
// Define custom format validators
const phoneValidator = (value: string) => {
  return /^\+[1-9]\d{1,14}$/.test(value);
};

// Use in validation
const result = validateOpenAPI(spec, {
  customFormats: {
    phone: phoneValidator,
  },
});
```

### Combining Multiple Options

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

### Configuration File

Create `.oas-validate.json` for persistent options:

```json
{
  "strict": true,
  "allowFutureOASVersions": false,
  "requireRateLimitHeaders": true,
  "format": "pretty"
}
```

## Documentation

- [Schema Validation Guide](./docs/schemas.md)
- [Format Support](./docs/formats.md)
- [Validation Options](./docs/validation.md)
- [Error Reference](./docs/errors.md)
- [Examples](./docs/examples/)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## License

- MIT © Thomas Peterson + Jakub Riedl @ https://www.appear.sh

## Core maintainers

- X: https://x.com/Tom_MkV
- X: https://x.com/jakubriedl
- X: https://x.com/AppearAPI
