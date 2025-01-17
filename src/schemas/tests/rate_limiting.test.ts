import { validateOpenAPI } from '../validator';
import { describe, test, expect } from '@jest/globals';
import type { OpenAPISpec } from '.././types';

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
                    schema: { type: 'integer' as const },
                    description: 'Request limit per hour'
                  },
                  'X-RateLimit-Remaining': {
                    schema: { type: 'integer' as const },
                    description: 'Remaining requests for the time window'
                  },
                  'X-RateLimit-Reset': {
                    schema: { type: 'integer' as const },
                    description: 'Time until the rate limit resets'
                  }
                }
              },
              '429': {
                description: 'Too Many Requests',
                headers: {
                  'Retry-After': {
                    schema: { type: 'integer' as const },
                    description: 'Time to wait before retrying'
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