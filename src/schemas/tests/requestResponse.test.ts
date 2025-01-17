import { MediaTypeObject, RequestBodyObject, ResponseObject, ResponsesObject } from '../requestResponse';
import { describe, test, expect } from '@jest/globals';
import { validateOpenAPI } from '../validator';

describe('Request/Response Schema Types', () => {
  describe('MediaTypeObject', () => {
    test('validates basic media type object', () => {
      const mediaType = {
        schema: { 
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' }
          }
        },
        example: { id: '1', name: 'test' }
      };
      expect(() => MediaTypeObject.parse(mediaType)).not.toThrow();
    });

    test('validates media type with examples', () => {
      const mediaType = {
        schema: { 
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        },
        examples: {
          test: {
            summary: 'Test example',
            value: { id: '1' }
          }
        }
      };
      expect(() => MediaTypeObject.parse(mediaType)).not.toThrow();
    });

    test('rejects invalid example combinations', () => {
      const mediaType = {
        examples: {
          test: {
            value: { id: 1 },
            externalValue: 'http://example.com/example.json'
          }
        }
      };
      expect(() => MediaTypeObject.parse(mediaType)).toThrow();
    });

    test('validates media type with schema', () => {
      const mediaType = {
        schema: { 
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        }
      };
      expect(() => MediaTypeObject.parse(mediaType)).not.toThrow();
    });

    test('validates media type with example', () => {
      const mediaType = {
        schema: { type: 'string' },
        example: 'test-value'
      };
      expect(() => MediaTypeObject.parse(mediaType)).not.toThrow();
    });

    test('validates media type with encoding', () => {
      const mediaType = {
        schema: { 
          type: 'object',
          properties: {
            profileImage: { type: 'string', format: 'binary' }
          }
        },
        encoding: {
          profileImage: {
            contentType: 'image/png',
            headers: {
              'X-Upload-Token': {
                schema: { 
                  type: 'string',
                  properties: {
                    token: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      };
      expect(() => MediaTypeObject.parse(mediaType)).not.toThrow();
    });

    test('rejects invalid examples combination', () => {
      const mediaType = {
        schema: { type: 'string' },
        examples: {
          test: {
            value: 'test',
            externalValue: 'http://example.com/test' // Can't have both
          }
        }
      };
      expect(() => MediaTypeObject.parse(mediaType)).toThrow();
    });
  });

  describe('RequestBodyObject', () => {
    test('validates complete request body', () => {
      const requestBody = {
        description: 'Test request body',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' }
              }
            }
          }
        }
      };
      expect(() => RequestBodyObject.parse(requestBody)).not.toThrow();
    });

    test('validates minimal request body', () => {
      const requestBody = {
        content: {
          'application/json': {}
        }
      };
      expect(() => RequestBodyObject.parse(requestBody)).not.toThrow();
    });
  });

  describe('ResponseObject', () => {
    test('validates complete response', () => {
      const response = {
        description: 'Test response',
        headers: {
          'X-Test': {
            description: 'Test header',
            schema: { type: 'string' }
          }
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                result: { type: 'string' }
              }
            }
          }
        }
      };
      expect(() => ResponseObject.parse(response)).not.toThrow();
    });

    test('validates response with links', () => {
      const response = {
        description: 'Test response',
        links: {
          testLink: {
            operationId: 'getUser',
            parameters: {
              userId: '$response.body#/id'
            }
          }
        }
      };
      expect(() => ResponseObject.parse(response)).not.toThrow();
    });

    test('rejects invalid link objects', () => {
      const response = {
        description: 'Test response',
        links: {
          testLink: {
            operationRef: '#/paths/user',
            operationId: 'getUser' // Can't have both
          }
        }
      };
      expect(() => ResponseObject.parse(response)).toThrow();
    });

    test('validates response with rate limit headers', () => {
      const doc = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Test response',
                  headers: {
                    'X-RateLimit-Limit': {
                      description: 'Rate limit per hour',
                      schema: { type: 'integer' }
                    },
                    'X-RateLimit-Remaining': {
                      description: 'Remaining requests',
                      schema: { type: 'integer' }
                    },
                    'X-RateLimit-Reset': {
                      description: 'Time until reset',
                      schema: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      };
      const result = validateOpenAPI(doc, { 
        strict: true, 
        strictRules: { requireRateLimitHeaders: true } 
      });
      expect(result.valid).toBe(true);
    });

    test('rejects response missing rate limit headers in strict mode', () => {
      const doc = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Test response',
                  headers: {
                    'X-Test': {
                      description: 'Test header',
                      schema: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      };
      const result = validateOpenAPI(doc, { 
        strict: true, 
        strictRules: { requireRateLimitHeaders: true } 
      });
      expect(result.valid).toBe(false);
      expect(result.errors?.issues[0].message).toBe('Rate limiting headers are required in strict mode');
    });

    test('rejects response with only some rate limit headers', () => {
      const partialHeaders = [
        {
          description: 'Missing Reset',
          headers: {
            'X-RateLimit-Limit': { schema: { type: 'integer' } },
            'X-RateLimit-Remaining': { schema: { type: 'integer' } }
          }
        },
        {
          description: 'Missing Remaining',
          headers: {
            'X-RateLimit-Limit': { schema: { type: 'integer' } },
            'X-RateLimit-Reset': { schema: { type: 'integer' } }
          }
        },
        {
          description: 'Missing Limit',
          headers: {
            'X-RateLimit-Remaining': { schema: { type: 'integer' } },
            'X-RateLimit-Reset': { schema: { type: 'integer' } }
          }
        }
      ];

      partialHeaders.forEach(headerSet => {
        const doc = {
          openapi: '3.0.0',
          info: { title: 'Test API', version: '1.0.0' },
          paths: {
            '/test': {
              get: {
                responses: {
                  '200': {
                    description: 'Test response',
                    headers: headerSet.headers
                  }
                }
              }
            }
          }
        };

        const result = validateOpenAPI(doc, { 
          strict: true, 
          strictRules: { requireRateLimitHeaders: true } 
        });
        expect(result.valid).toBe(false);
        expect(result.errors?.issues[0].message).toBe('Rate limiting headers are required in strict mode');
      });
    });
  });

  describe('ResponsesObject', () => {
    test('validates response map', () => {
      const responses = {
        '200': {
          description: 'OK response'
        },
        'default': {
          description: 'Default response'
        }
      };
      expect(() => ResponsesObject.parse(responses)).not.toThrow();
    });

    test('validates responses with references', () => {
      const responses = {
        '200': { $ref: '#/components/responses/Success' },
        '404': { $ref: '#/components/responses/NotFound' }
      };
      expect(() => ResponsesObject.parse(responses)).not.toThrow();
    });
  });
});