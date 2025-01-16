import { validateOpenAPI } from '../validator';
import { describe, test, expect } from '@jest/globals';

describe('OpenAPI 3.1 Validation', () => {
  test('validates a basic 3.1 openapi spec with webhooks', () => {
    const spec3_1 = {
      openapi: '3.1.0',
      info: { title: 'Test API 3.1', version: '1.0.0' },
      jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
      webhooks: {
        // webhooks must be an object with *keys* that are the webhook paths
        '/onData': {
          post: { responses: { '200': { description: 'OK' } } }
        }
      }
    };

    const result = validateOpenAPI(spec3_1);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
    // If your doc had references, check result.resolvedRefs here
  });

  test('validates a 3.1 spec with component references in webhooks', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Webhooks Example', version: '1.0.0' },
      components: {
        schemas: { Payload: { type: 'object', properties: { msg: { type: 'string' } } } },
      },
      webhooks: {
        '/onEvent': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Payload' }
                }
              }
            }
          },
          responses: { '200': { description: 'OK' } }
        }
      }
    };

    const result = validateOpenAPI(spec, { strict: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
    expect(result.resolvedRefs).toContain('#/components/schemas/Payload');
  });
});
