import { describe, test, expect } from 'vitest';
import { validateOpenAPI } from '../validator.js';

describe('OpenAPI 3.2 features', () => {
  test('accepts $self and Server.name, tags metadata', () => {
    const doc = {
      openapi: '3.2.0',
      $self: 'https://api.example.com/openapi.yaml',
      info: { title: 'API', version: '1.0.0' },
      servers: [
        { url: 'https://api.example.com', name: 'prod' },
        { url: 'https://staging-api.example.com', name: 'staging' },
      ],
      tags: [
        { name: 'users', summary: 'User operations', kind: 'nav' },
        { name: 'admin', parent: 'users' },
      ],
      paths: {},
    };
    const result = validateOpenAPI(doc);
    expect(result.valid).toBe(true);
  });

  test('supports query method and additionalOperations', () => {
    const doc = {
      openapi: '3.2.1',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/q': {
          query: {
            responses: { '200': { description: 'OK' } },
          },
          additionalOperations: {
            LINK: {
              responses: { '204': { description: 'No Content' } },
            },
          },
        },
      },
    };
    const result = validateOpenAPI(doc);
    expect(result.valid).toBe(true);
  });

  test('allows querystring parameter with content, disallows schema+content together', () => {
    const good = {
      openapi: '3.2.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            parameters: [
              {
                name: 'q',
                in: 'querystring',
                content: {
                  'application/json': { schema: { type: 'object' } },
                },
              },
            ],
            responses: { default: { description: 'x' } },
          },
        },
      },
    };
    const bad = {
      openapi: '3.2.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            parameters: [
              {
                name: 'q',
                in: 'querystring',
                schema: { type: 'string' },
                content: { 'application/json': {} },
              },
            ],
            responses: { default: { description: 'x' } },
          },
        },
      },
    };
    expect(validateOpenAPI(good).valid).toBe(true);
    expect(validateOpenAPI(bad).valid).toBe(false);
  });

  test('MediaType itemSchema for streaming/sequential media', () => {
    const doc = {
      openapi: '3.2.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/stream': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/jsonl': {
                    itemSchema: { type: 'object', properties: { id: { type: 'string' } } },
                  },
                },
              },
            },
          },
        },
      },
    };
    expect(validateOpenAPI(doc).valid).toBe(true);
  });

  test('Examples allow dataValue and serializedValue (only one at a time)', () => {
    const good = {
      openapi: '3.2.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/ex': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    examples: {
                      a: { dataValue: { id: 1 } },
                      b: { serializedValue: '{"id":1}' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const bad = {
      openapi: '3.2.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/ex': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    examples: {
                      a: { value: { id: 1 }, dataValue: { id: 1 } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    expect(validateOpenAPI(good).valid).toBe(true);
    expect(validateOpenAPI(bad).valid).toBe(false);
  });

  test('Response summary allowed and description optional', () => {
    const doc = {
      openapi: '3.2.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/ok': {
          get: {
            responses: {
              '200': { summary: 'No description required' },
            },
          },
        },
      },
    };
    expect(validateOpenAPI(doc).valid).toBe(true);
  });
});


