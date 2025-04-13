import { describe, test, expect } from 'vitest';
import { z } from 'zod';
import { 
  SchemaValidationError, 
  ReferenceError, 
  StrictValidationError, 
  VersionError, 
  ErrorCode 
} from '../index.js';

describe('Validation Error Classes', () => {
  describe('SchemaValidationError', () => {
    test('creates error with required properties', () => {
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['info', 'title'],
          message: 'Expected string, received number'
        }
      ]);
      
      const error = new SchemaValidationError('Schema validation failed', zodError);
      
      expect(error).toBeInstanceOf(SchemaValidationError);
      expect(error.message).toBe('Schema validation failed');
      expect(error.code).toBe(ErrorCode.SCHEMA_VALIDATION);
      expect(error.zodError).toBe(zodError);
      expect(error.source).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
    
    test('creates error with source', () => {
      const zodError = new z.ZodError([]);
      const error = new SchemaValidationError('Schema validation failed', zodError, {
        source: 'openapi.yaml'
      });
      
      expect(error.message).toBe('Schema validation failed');
      expect(error.source).toBe('openapi.yaml');
    });
    
    test('creates error with context', () => {
      const zodError = new z.ZodError([]);
      const context = { strict: true };
      const error = new SchemaValidationError('Schema validation failed', zodError, {
        context
      });
      
      expect(error.message).toBe('Schema validation failed');
      expect(error.context).toEqual(context);
    });
    
    test('creates error with all options', () => {
      const zodError = new z.ZodError([]);
      const context = { strict: true };
      const error = new SchemaValidationError('Schema validation failed', zodError, {
        source: 'openapi.yaml',
        context
      });
      
      expect(error.message).toBe('Schema validation failed');
      expect(error.source).toBe('openapi.yaml');
      expect(error.context).toEqual(context);
    });
    
    test('getFormattedErrors returns formatted error string', () => {
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['info', 'title'],
          message: 'Expected string, received number'
        },
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'undefined',
          path: ['info', 'version'],
          message: 'Required'
        }
      ]);
      
      const error = new SchemaValidationError('Schema validation failed', zodError);
      const formatted = error.getFormattedErrors();
      
      expect(formatted).toBe('info.title: Expected string, received number\ninfo.version: Required');
    });
    
    test('getFormattedErrors handles empty errors', () => {
      const zodError = new z.ZodError([]);
      const error = new SchemaValidationError('Schema validation failed', zodError);
      const formatted = error.getFormattedErrors();
      
      expect(formatted).toBe('');
    });
  });
  
  describe('ReferenceError', () => {
    test('creates error with required properties', () => {
      const error = new ReferenceError('#/components/schemas/Pet', 'Reference not found', {
        code: ErrorCode.REFERENCE_NOT_FOUND
      });
      
      expect(error).toBeInstanceOf(ReferenceError);
      expect(error.message).toBe('Reference not found');
      expect(error.code).toBe(ErrorCode.REFERENCE_NOT_FOUND);
      expect(error.reference).toBe('#/components/schemas/Pet');
      expect(error.source).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
    
    test('creates error with source', () => {
      const error = new ReferenceError('#/components/schemas/Pet', 'Reference not found', {
        code: ErrorCode.REFERENCE_NOT_FOUND,
        source: 'openapi.yaml'
      });
      
      expect(error.message).toBe('Reference not found');
      expect(error.source).toBe('openapi.yaml');
    });
    
    test('creates error with context', () => {
      const context = { path: ['paths', '/pets', 'get', 'responses', '200'] };
      const error = new ReferenceError('#/components/schemas/Pet', 'Reference not found', {
        code: ErrorCode.REFERENCE_NOT_FOUND,
        context
      });
      
      expect(error.message).toBe('Reference not found');
      expect(error.context).toEqual(context);
    });
    
    test('creates error with all options', () => {
      const context = { path: ['paths', '/pets', 'get', 'responses', '200'] };
      const error = new ReferenceError('#/components/schemas/Pet', 'Reference not found', {
        code: ErrorCode.REFERENCE_NOT_FOUND,
        source: 'openapi.yaml',
        context
      });
      
      expect(error.message).toBe('Reference not found');
      expect(error.source).toBe('openapi.yaml');
      expect(error.context).toEqual(context);
    });
    
    test('supports different error codes', () => {
      const invalidRef = new ReferenceError('#invalid', 'Invalid reference format', {
        code: ErrorCode.INVALID_REFERENCE
      });
      
      const notFound = new ReferenceError('#/nonexistent', 'Reference not found', {
        code: ErrorCode.REFERENCE_NOT_FOUND
      });
      
      const circular = new ReferenceError('#/circular', 'Circular reference detected', {
        code: ErrorCode.CIRCULAR_REFERENCE
      });
      
      expect(invalidRef.code).toBe(ErrorCode.INVALID_REFERENCE);
      expect(notFound.code).toBe(ErrorCode.REFERENCE_NOT_FOUND);
      expect(circular.code).toBe(ErrorCode.CIRCULAR_REFERENCE);
    });
  });
  
  describe('StrictValidationError', () => {
    test('creates error with default options', () => {
      const error = new StrictValidationError('Strict validation failed');
      
      expect(error).toBeInstanceOf(StrictValidationError);
      expect(error.message).toBe('Strict validation failed');
      expect(error.code).toBe(ErrorCode.STRICT_VALIDATION); // Default code
      expect(error.source).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
    
    test('creates error with specific code', () => {
      const error = new StrictValidationError('Rate limit headers required', {
        code: ErrorCode.RATE_LIMIT_REQUIRED
      });
      
      expect(error.message).toBe('Rate limit headers required');
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_REQUIRED);
    });
    
    test('creates error with source', () => {
      const error = new StrictValidationError('Strict validation failed', {
        source: 'openapi.yaml'
      });
      
      expect(error.message).toBe('Strict validation failed');
      expect(error.source).toBe('openapi.yaml');
    });
    
    test('creates error with context', () => {
      const context = { path: ['paths', '/pets', 'get', 'responses', '200'] };
      const error = new StrictValidationError('Strict validation failed', {
        context
      });
      
      expect(error.message).toBe('Strict validation failed');
      expect(error.context).toEqual(context);
    });
    
    test('creates error with all options', () => {
      const context = { path: ['paths', '/pets', 'get', 'responses', '200'] };
      const error = new StrictValidationError('Rate limit headers required', {
        code: ErrorCode.RATE_LIMIT_REQUIRED,
        source: 'openapi.yaml',
        context
      });
      
      expect(error.message).toBe('Rate limit headers required');
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_REQUIRED);
      expect(error.source).toBe('openapi.yaml');
      expect(error.context).toEqual(context);
    });
  });
  
  describe('VersionError', () => {
    test('creates error with default message', () => {
      const error = new VersionError('2.0.0');
      
      expect(error).toBeInstanceOf(VersionError);
      expect(error.message).toBe('Unsupported OpenAPI version: 2.0.0');
      expect(error.code).toBe(ErrorCode.UNSUPPORTED_VERSION);
      expect(error.version).toBe('2.0.0');
      expect(error.source).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
    
    test('creates error with custom message', () => {
      const error = new VersionError('2.0.0', 'OpenAPI 2.0 is not supported');
      
      expect(error.message).toBe('OpenAPI 2.0 is not supported');
      expect(error.version).toBe('2.0.0');
    });
    
    test('creates error with source', () => {
      const error = new VersionError('2.0.0', 'Unsupported version', {
        source: 'openapi.yaml'
      });
      
      expect(error.message).toBe('Unsupported version');
      expect(error.source).toBe('openapi.yaml');
    });
    
    test('creates error with context', () => {
      const context = { allowedVersions: ['3.0.0', '3.1.0'] };
      const error = new VersionError('2.0.0', 'Unsupported version', {
        context
      });
      
      expect(error.message).toBe('Unsupported version');
      expect(error.context).toEqual(context);
    });
    
    test('creates error with all options', () => {
      const context = { allowedVersions: ['3.0.0', '3.1.0'] };
      const error = new VersionError('2.0.0', 'Unsupported version', {
        source: 'openapi.yaml',
        context
      });
      
      expect(error.message).toBe('Unsupported version');
      expect(error.source).toBe('openapi.yaml');
      expect(error.context).toEqual(context);
    });
  });
}); 