import { validateOpenAPI } from '../validator.js';
import { describe, test, expect } from 'vitest';
import type { OpenAPISpec } from '../types.js';

describe('Rate Limiting Validation', () => {
  test('validates rate limiting headers', () => {
    const specWithRateLimiting: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'Enterprise API',
        version: '1.0.0'
      },
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'Success',
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

    const result = validateOpenAPI(specWithRateLimiting);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('validates missing rate limiting headers', () => {
    const specWithoutRateLimiting: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'Enterprise API',
        version: '1.0.0'
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

    const result = validateOpenAPI(specWithoutRateLimiting, { 
      strict: true,
      strictRules: {
        requireRateLimitHeaders: true
      }
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});