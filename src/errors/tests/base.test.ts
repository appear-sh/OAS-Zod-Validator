import { describe, test, expect } from 'vitest';
import { OpenAPIValidatorError, ErrorCode } from '../base.js';

describe('Base Error Classes', () => {
  describe('OpenAPIValidatorError', () => {
    test('creates error with required properties', () => {
      const error = new OpenAPIValidatorError('Base error message', {
        code: ErrorCode.INTERNAL_ERROR
      });
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OpenAPIValidatorError);
      expect(error.message).toBe('Base error message');
      expect(error.name).toBe('OpenAPIValidatorError');
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.source).toBeUndefined();
      expect(error.context).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });
    
    test('creates error with source', () => {
      const error = new OpenAPIValidatorError('Base error message', {
        code: ErrorCode.INTERNAL_ERROR,
        source: 'validator.ts'
      });
      
      expect(error.message).toBe('Base error message');
      expect(error.source).toBe('validator.ts');
    });
    
    test('creates error with context', () => {
      const context = { method: 'validateOpenAPI' };
      const error = new OpenAPIValidatorError('Base error message', {
        code: ErrorCode.INTERNAL_ERROR,
        context
      });
      
      expect(error.message).toBe('Base error message');
      expect(error.context).toEqual(context);
    });
    
    test('creates error with cause', () => {
      const cause = new Error('Original error');
      const error = new OpenAPIValidatorError('Base error message', {
        code: ErrorCode.INTERNAL_ERROR,
        cause
      });
      
      expect(error.message).toBe('Base error message');
      expect(error.cause).toBe(cause);
    });
    
    test('creates error with all options', () => {
      const cause = new Error('Original error');
      const context = { method: 'validateOpenAPI' };
      const error = new OpenAPIValidatorError('Base error message', {
        code: ErrorCode.INTERNAL_ERROR,
        source: 'validator.ts',
        context,
        cause
      });
      
      expect(error.message).toBe('Base error message');
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.source).toBe('validator.ts');
      expect(error.context).toEqual(context);
      expect(error.cause).toBe(cause);
    });
    
    test('maintains prototype chain', () => {
      const error = new OpenAPIValidatorError('Test error', {
        code: ErrorCode.INTERNAL_ERROR
      });
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof OpenAPIValidatorError).toBe(true);
      expect(Object.getPrototypeOf(error)).toBe(OpenAPIValidatorError.prototype);
    });
    
    test('preserves stack trace', () => {
      const error = new OpenAPIValidatorError('Test error', {
        code: ErrorCode.INTERNAL_ERROR
      });
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Test error');
    });
  });
  
  describe('ErrorCode', () => {
    test('contains expected error codes', () => {
      expect(ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(ErrorCode.UNSUPPORTED_VERSION).toBe('UNSUPPORTED_VERSION');
      expect(ErrorCode.SCHEMA_VALIDATION).toBe('SCHEMA_VALIDATION');
      
      expect(ErrorCode.INVALID_REFERENCE).toBe('INVALID_REFERENCE');
      expect(ErrorCode.REFERENCE_NOT_FOUND).toBe('REFERENCE_NOT_FOUND');
      expect(ErrorCode.CIRCULAR_REFERENCE).toBe('CIRCULAR_REFERENCE');
      
      expect(ErrorCode.STRICT_VALIDATION).toBe('STRICT_VALIDATION');
      expect(ErrorCode.RATE_LIMIT_REQUIRED).toBe('RATE_LIMIT_REQUIRED');
      
      expect(ErrorCode.FILE_READ_ERROR).toBe('FILE_READ_ERROR');
      expect(ErrorCode.INVALID_YAML).toBe('INVALID_YAML');
      expect(ErrorCode.INVALID_JSON).toBe('INVALID_JSON');
      
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
  });
}); 