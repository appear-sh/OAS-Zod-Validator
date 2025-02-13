import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { validateOpenAPI, ValidationResult, ValidationOptions } from '../../schemas/validator.js';
import { OpenAPISpec } from '../../schemas/types.js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { z } from 'zod';

// Mock fs module
const mockReadFileSync = jest.fn();
const mockExistsSync = jest.fn();
jest.mock('fs', () => ({
  readFileSync: mockReadFileSync,
  existsSync: mockExistsSync
}));

// Mock path module
const mockJoin = jest.fn();
jest.mock('path', () => ({
  join: mockJoin
}));

// Mock chalk
jest.mock('chalk', () => ({
  blue: jest.fn((text) => text),
  green: jest.fn((text) => text),
  red: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  white: {
    bold: jest.fn((text) => text)
  }
}));

// Mock validateOpenAPI
jest.mock('../../schemas/validator.js', () => ({
  validateOpenAPI: jest.fn()
}));

// Import after mocking
import {
  countOperations,
  countUnsecuredEndpoints,
  checkBestPractices,
  findCircularRefs,
  countExternalRefs,
  testSpec,
  generateValidationSummary
} from '../spec-tester.js';

describe('Spec Tester Utilities', () => {
  let mockSpec: OpenAPISpec;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {},
      components: {
        schemas: {}
      }
    };
  });

  describe('countOperations', () => {
    test('counts operations correctly', () => {
      mockSpec.paths = {
        '/test': {
          get: { responses: {} },
          post: { responses: {} }
        },
        '/another': {
          get: { responses: {} }
        }
      };
      expect(countOperations(mockSpec)).toBe(3);
    });

    test('handles empty paths', () => {
      mockSpec.paths = {};
      expect(countOperations(mockSpec)).toBe(0);
    });

    test('handles undefined paths', () => {
      mockSpec.paths = undefined;
      expect(countOperations(mockSpec)).toBe(0);
    });
  });

  describe('countUnsecuredEndpoints', () => {
    test('counts unsecured endpoints correctly', () => {
      mockSpec.paths = {
        '/test': {
          get: { responses: {} },
          post: { responses: {} }
        }
      };
      mockSpec.security = undefined;
      expect(countUnsecuredEndpoints(mockSpec)).toBe(2);
    });

    test('handles secured endpoints', () => {
      mockSpec.paths = {
        '/test': {
          get: { responses: {} }
        }
      };
      mockSpec.security = [{ ApiKey: [] }];
      expect(countUnsecuredEndpoints(mockSpec)).toBe(0);
    });

    test('handles empty paths', () => {
      mockSpec.paths = {};
      expect(countUnsecuredEndpoints(mockSpec)).toBe(0);
    });
  });

  describe('checkBestPractices', () => {
    test('checks for missing API description', () => {
      const warnings = checkBestPractices(mockSpec);
      expect(warnings).toContain('API description is missing');
    });

    test('checks for missing operation responses', () => {
      mockSpec.paths = {
        '/test': {
          get: {}
        }
      };
      const warnings = checkBestPractices(mockSpec);
      expect(warnings).toContain('Operation GET /test is missing responses');
    });

    test('checks for missing success responses', () => {
      mockSpec.paths = {
        '/test': {
          get: {
            responses: {
              '400': { description: 'Bad Request' }
            }
          }
        }
      };
      const warnings = checkBestPractices(mockSpec);
      expect(warnings).toContain('Operation GET /test is missing success response');
    });

    test('checks for missing schema descriptions', () => {
      mockSpec.components = {
        schemas: {
          Test: {
            type: 'object',
            properties: {}
          }
        }
      };
      const warnings = checkBestPractices(mockSpec);
      expect(warnings).toContain('Schema "Test" is missing description');
    });
  });

  describe('findCircularRefs', () => {
    test('finds simple circular references', () => {
      const circularSpec = {
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                friend: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      };
      const refs = findCircularRefs(circularSpec);
      expect(refs).toContain('#/components/schemas/User');
    });

    test('handles no circular references', () => {
      const refs = findCircularRefs(mockSpec);
      expect(refs).toHaveLength(0);
    });

    test('handles nested circular references', () => {
      const circularSpec = {
        components: {
          schemas: {
            A: {
              type: 'object',
              properties: {
                b: { $ref: '#/components/schemas/B' }
              }
            },
            B: {
              type: 'object',
              properties: {
                a: { $ref: '#/components/schemas/A' }
              }
            }
          }
        }
      };
      const refs = findCircularRefs(circularSpec);
      expect(refs).toContain('#/components/schemas/A');
      expect(refs).toContain('#/components/schemas/B');
    });
  });

  describe('countExternalRefs', () => {
    test('counts external references correctly', () => {
      const specWithRefs = {
        components: {
          schemas: {
            Internal: {
              $ref: '#/components/schemas/Test'
            },
            External: {
              $ref: 'https://example.com/schemas/Test'
            },
            Another: {
              $ref: './local-schema.json'
            }
          }
        }
      };
      expect(countExternalRefs(specWithRefs)).toBe(2);
    });

    test('handles no references', () => {
      expect(countExternalRefs(mockSpec)).toBe(0);
    });

    test('handles nested external references', () => {
      const specWithNestedRefs = {
        components: {
          schemas: {
            Test: {
              type: 'object',
              properties: {
                external: {
                  $ref: 'https://example.com/schemas/Test'
                }
              }
            }
          }
        }
      };
      expect(countExternalRefs(specWithNestedRefs)).toBe(1);
    });
  });

  describe('testSpec', () => {
    beforeEach(() => {
      // Mock fs.readFileSync
      mockReadFileSync.mockReturnValue(JSON.stringify(mockSpec));
      
      // Mock path.join
      mockJoin.mockReturnValue('/test/path/spec.json');

      // Mock validateOpenAPI
      (validateOpenAPI as jest.Mock).mockReturnValue(Promise.resolve({
        valid: true,
        resolvedRefs: [],
        errors: undefined
      }));

      // Mock console methods
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('validates a valid spec successfully', async () => {
      await testSpec();
      expect(validateOpenAPI).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ OpenAPI spec is valid'));
    });

    test('handles validation failures', async () => {
      const zodError = new z.ZodError([{
        code: z.ZodIssueCode.invalid_type,
        expected: 'string',
        received: 'number',
        path: ['info', 'title'],
        message: 'Expected string'
      }]);

      (validateOpenAPI as jest.Mock).mockReturnValue(Promise.resolve({
        valid: false,
        resolvedRefs: [],
        errors: zodError
      }));

      await testSpec();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('❌ OpenAPI spec validation failed'));
    });

    test('handles file read errors', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      await testSpec();
      expect(console.error).toHaveBeenCalled();
    });

    test('handles JSON parse errors', async () => {
      mockReadFileSync.mockReturnValue('invalid json');

      await testSpec();
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 