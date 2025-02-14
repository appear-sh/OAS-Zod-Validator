import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { OpenAPISpec } from '../../schemas/types.js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { z } from 'zod';
import type { ValidationResult, ValidationOptions } from '../../schemas/validator.js';

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
const mockValidateOpenAPI = jest.fn().mockImplementation(async () => ({
  valid: true,
  resolvedRefs: [],
  errors: undefined
}));

jest.mock('../../schemas/validator.js', () => ({
  validateOpenAPI: mockValidateOpenAPI
}));

describe('Spec Tester Utilities', () => {
  let mockSpec: OpenAPISpec;
  let specTesterModule: any;

  beforeEach(async () => {
    mockValidateOpenAPI.mockClear();

    specTesterModule = await import('../spec-tester.js');

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
      expect(specTesterModule.countOperations(mockSpec)).toBe(3);
    });

    test('handles empty paths', () => {
      mockSpec.paths = {};
      expect(specTesterModule.countOperations(mockSpec)).toBe(0);
    });

    test('handles undefined paths', () => {
      mockSpec.paths = undefined;
      expect(specTesterModule.countOperations(mockSpec)).toBe(0);
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
      expect(specTesterModule.countUnsecuredEndpoints(mockSpec)).toBe(2);
    });

    test('handles secured endpoints', () => {
      mockSpec.paths = {
        '/test': {
          get: { responses: {} }
        }
      };
      mockSpec.security = [{ ApiKey: [] }];
      expect(specTesterModule.countUnsecuredEndpoints(mockSpec)).toBe(0);
    });

    test('handles empty paths', () => {
      mockSpec.paths = {};
      expect(specTesterModule.countUnsecuredEndpoints(mockSpec)).toBe(0);
    });
  });

  describe('checkBestPractices', () => {
    test('checks for missing API description', () => {
      const warnings = specTesterModule.checkBestPractices(mockSpec);
      expect(warnings).toContain('API description is missing');
    });

    test('checks for missing operation responses', () => {
      mockSpec.paths = {
        '/test': {
          get: {}
        }
      };
      const warnings = specTesterModule.checkBestPractices(mockSpec);
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
      const warnings = specTesterModule.checkBestPractices(mockSpec);
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
      const warnings = specTesterModule.checkBestPractices(mockSpec);
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
      const refs = specTesterModule.findCircularRefs(circularSpec);
      expect(refs).toContain('#/components/schemas/User');
    });

    test('handles no circular references', () => {
      const refs = specTesterModule.findCircularRefs(mockSpec);
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
      const refs = specTesterModule.findCircularRefs(circularSpec);
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
      expect(specTesterModule.countExternalRefs(specWithRefs)).toBe(2);
    });

    test('handles no references', () => {
      expect(specTesterModule.countExternalRefs(mockSpec)).toBe(0);
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
      expect(specTesterModule.countExternalRefs(specWithNestedRefs)).toBe(1);
    });
  });

  describe('generateValidationSummary', () => {
    test('generates summary for valid spec', () => {
      const validSpec: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': { get: { responses: { '200': { description: 'OK' } } } }
        },
        components: {
          schemas: {
            Test: { type: 'object', properties: {} }
          }
        }
      };
      const validResult: ValidationResult = {
        valid: true,
        resolvedRefs: [],
        errors: undefined
      };
      
      const summary = specTesterModule.generateValidationSummary(validSpec, validResult);
      expect(summary.valid).toBe(2); // 1 path + 1 schema
      expect(summary.invalid).toBe(0);
      expect(summary.total).toBe(2);
    });

    test('generates summary for invalid spec', () => {
      const invalidSpec: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': { get: { responses: {} } }
        },
        components: {
          schemas: {
            Test: { type: 'object', properties: {} }
          }
        }
      };
      const invalidResult: ValidationResult = {
        valid: false,
        resolvedRefs: [],
        errors: new z.ZodError([
          {
            code: z.ZodIssueCode.invalid_type,
            expected: 'string',
            received: 'number',
            path: ['paths', '/test', 'get'],
            message: 'Invalid type'
          },
          {
            code: z.ZodIssueCode.invalid_type,
            expected: 'string',
            received: 'number',
            path: ['components', 'schemas', 'Test'],
            message: 'Invalid type'
          }
        ])
      };
      
      const summary = specTesterModule.generateValidationSummary(invalidSpec, invalidResult);
      expect(summary.valid).toBe(0);
      expect(summary.invalid).toBe(2); // 1 invalid path + 1 invalid schema
      expect(summary.total).toBe(2);
    });
  });

  describe('testSpec', () => {
    beforeEach(() => {
      mockReadFileSync.mockReturnValue(JSON.stringify(mockSpec));
      mockJoin.mockReturnValue('/test/path/spec.json');
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('validates a valid spec successfully', async () => {
      mockValidateOpenAPI.mockReturnValue({
        valid: true,
        resolvedRefs: [],
        errors: undefined
      });

      await specTesterModule.testSpec();
      expect(mockValidateOpenAPI).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ OpenAPI spec is valid'));
    });

    test('handles validation failures', async () => {
      mockValidateOpenAPI.mockReturnValue({
        valid: false,
        resolvedRefs: [],
        errors: new z.ZodError([{
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['info', 'title'],
          message: 'Test error'
        }])
      });

      await specTesterModule.testSpec();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('❌ OpenAPI spec validation failed'));
    });

    test('handles file read errors', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      await specTesterModule.testSpec();
      expect(console.error).toHaveBeenCalled();
    });

    test('handles JSON parse errors', async () => {
      mockReadFileSync.mockReturnValue('invalid json');

      await specTesterModule.testSpec();
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 