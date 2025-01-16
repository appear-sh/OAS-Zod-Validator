import { validateOpenAPI } from '../validator';
import { describe, test, expect } from '@jest/globals';

describe('OpenAPI 3.1 Validation', () => {
  test('validates a basic 3.1 openapi spec', () => {
    const spec3_1 = {
      openapi: '3.1.0',
      info: {
        title: '3.1 Test API',
        version: '1.0.0',
      },
      jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
      paths: {
        '/example': {
          get: {
            responses: {
              '200': { description: 'OK' }
            }
          }
        }
      }
    };

    const result = validateOpenAPI(spec3_1, { allowFutureOASVersions: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  // Additional tests for 3.1-specific fields like webhooks, if needed
});
