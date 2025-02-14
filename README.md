# OAS-Zod-Validator

A robust OpenAPI Specification (OAS) validator built with Zod, providing type-safe validation for both OAS 3.0.x and 3.1 documents.

[![npm version](https://badge.fury.io/js/oas-zod-validator.svg)](https://badge.fury.io/js/oas-zod-validator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✨ Full OpenAPI 3.0.x and 3.1 support
- 🛡️ Type-safe validation using Zod
- 🔍 Detailed error messages
- 📦 Zero external runtime dependencies
- 🚀 Enterprise-ready with strict mode validation
- 🌐 Supports both YAML and JSON formats

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

# With options
oas-validate --strict --rate-limits api.json
```

## Documentation

- [Schema Validation Guide](./docs/schemas.md)
- [Format Support](./docs/formats.md)
- [Validation Options](./docs/validation.md)
- [Error Reference](./docs/errors.md)
- [Examples](./docs/examples/)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

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

MIT © [Your Name]
