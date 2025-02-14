# OAS Zod Validator Development Guide

## Project Structure

The project is an OpenAPI Specification validator built with Zod, focusing on strict validation and best practices enforcement.

## Testing Strategy

### Spec Tester (`src/utils/spec-tester.ts`)

The spec tester provides utilities for:

- Counting operations and endpoints
- Checking for unsecured endpoints
- Validating best practices
- Finding circular references
- Counting external references
- Generating validation summaries

#### Test Setup

When writing tests for the spec tester, follow these patterns:

```typescript
// Mock setup
jest.mock("../../schemas/validator.js", () => ({
  validateOpenAPI: jest.fn().mockImplementation(async () => ({
    valid: true,
    resolvedRefs: [],
    errors: undefined,
  })),
}));

// Reset mocks in beforeEach
beforeEach(() => {
  jest.clearAllMocks();
  (validateOpenAPI as jest.Mock).mockReset().mockImplementation(async () => ({
    valid: true,
    resolvedRefs: [],
    errors: undefined,
  }));
});

// Mock validation results
(validateOpenAPI as jest.Mock).mockImplementation(async () => ({
  valid: true, // or false
  resolvedRefs: [],
  errors: undefined, // or new z.ZodError([...])
}));
```

### Test Coverage Requirements

The project maintains strict test coverage requirements:

- Statements: 60%
- Branches: 60%
- Functions: 57%
- Lines: 61%

## CLI Development

The CLI component (`src/schemas/cli.ts`) provides command-line functionality for:

- Validating OpenAPI specs from YAML/JSON files
- Enforcing strict validation rules
- Supporting future OAS versions
- Requiring rate limit headers

### Current Issues

1. Test Coverage:

   - The CLI component currently has 0% coverage
   - Need to implement comprehensive tests for all CLI functionality

2. Spec Tester:
   - Mock setup for `validateOpenAPI` needs careful typing
   - Test coverage for edge cases needs improvement

## Next Steps

1. Improve CLI test coverage:

   - Add unit tests for all CLI options
   - Test error handling scenarios
   - Test file reading and validation

2. Enhance spec tester:
   - Add more test cases for complex scenarios
   - Improve error reporting
   - Add performance benchmarks

## Best Practices

1. Testing:

   - Always mock external dependencies
   - Reset mocks in `beforeEach`
   - Test both success and failure cases
   - Test edge cases and error handling

2. TypeScript:

   - Use proper type assertions for mocks
   - Maintain strict type checking
   - Document complex type interactions

3. Code Organization:
   - Keep tests alongside source files
   - Use descriptive test names
   - Group related tests in describe blocks

## Common Issues and Solutions

### Mock Setup Issues

Problem: TypeScript errors with jest.Mock typing
Solution: Use proper type assertions and mock implementations:

```typescript
jest.mock("../../schemas/validator.js", () => ({
  validateOpenAPI: jest.fn().mockImplementation(async () => ({
    valid: true,
    resolvedRefs: [],
    errors: undefined,
  })),
}));
```

### Test Coverage

Problem: Low test coverage in certain areas
Solution:

- Identify uncovered code paths
- Add test cases for edge cases
- Use jest coverage reports to track improvements
