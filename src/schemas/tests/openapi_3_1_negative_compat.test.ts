import { describe, test, expect } from 'vitest';
import { validateOpenAPI } from '../validator.js';

describe('OpenAPI 3.1 compatibility with 3.2-only features', () => {
  test('rejects examples.dataValue in 3.1.x', () => {
    const doc = {
      openapi: '3.1.1',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/ex': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    examples: { a: { dataValue: { id: 1 } } },
                  },
                },
              },
            },
          },
        },
      },
    };
    const result = validateOpenAPI(doc);
    expect(result.valid).toBe(false);
  });
});


