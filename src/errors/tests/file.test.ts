import { describe, test, expect } from '@jest/globals';
import { 
  FileError, 
  YAMLParseError, 
  JSONParseError, 
  ErrorCode 
} from '../index.js';

describe('File Error Classes', () => {
  describe('FileError', () => {
    test('creates error with minimal options', () => {
      const error = new FileError('File error message', {
        code: ErrorCode.FILE_READ_ERROR
      });
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FileError);
      expect(error.message).toBe('File error message');
      expect(error.code).toBe(ErrorCode.FILE_READ_ERROR);
      expect(error.filePath).toBeUndefined();
      expect(error.cause).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
    
    test('creates error with file path', () => {
      const error = new FileError('File not found', {
        code: ErrorCode.FILE_READ_ERROR,
        filePath: '/path/to/file.yaml'
      });
      
      expect(error.message).toBe('File not found');
      expect(error.code).toBe(ErrorCode.FILE_READ_ERROR);
      expect(error.filePath).toBe('/path/to/file.yaml');
      expect(error.source).toBe('/path/to/file.yaml'); // Source should match filePath
    });
    
    test('creates error with cause', () => {
      const cause = new Error('Original error');
      const error = new FileError('Failed to read file', {
        code: ErrorCode.FILE_READ_ERROR,
        cause
      });
      
      expect(error.message).toBe('Failed to read file');
      expect(error.cause).toBe(cause);
    });
    
    test('creates error with context', () => {
      const context = { attemptedOperation: 'read' };
      const error = new FileError('Failed to read file', {
        code: ErrorCode.FILE_READ_ERROR,
        context
      });
      
      expect(error.message).toBe('Failed to read file');
      expect(error.context).toEqual(context);
    });
    
    test('creates error with all options', () => {
      const cause = new Error('Original error');
      const context = { 
        attemptedOperation: 'read',
        permissions: 'read-only' 
      };
      const error = new FileError('Failed to read file', {
        code: ErrorCode.FILE_READ_ERROR,
        filePath: '/path/to/file.yaml',
        cause,
        context
      });
      
      expect(error.message).toBe('Failed to read file');
      expect(error.code).toBe(ErrorCode.FILE_READ_ERROR);
      expect(error.filePath).toBe('/path/to/file.yaml');
      expect(error.source).toBe('/path/to/file.yaml');
      expect(error.cause).toBe(cause);
      expect(error.context).toEqual(context);
    });
    
    test('supports different error codes', () => {
      const yamlError = new FileError('YAML parsing error', {
        code: ErrorCode.INVALID_YAML
      });
      
      const jsonError = new FileError('JSON parsing error', {
        code: ErrorCode.INVALID_JSON
      });
      
      expect(yamlError.code).toBe(ErrorCode.INVALID_YAML);
      expect(jsonError.code).toBe(ErrorCode.INVALID_JSON);
    });
  });
  
  describe('YAMLParseError', () => {
    test('creates YAML error with default options', () => {
      const error = new YAMLParseError('Invalid YAML syntax');
      
      expect(error).toBeInstanceOf(YAMLParseError);
      expect(error).toBeInstanceOf(FileError);
      expect(error.message).toBe('Invalid YAML syntax');
      expect(error.code).toBe(ErrorCode.INVALID_YAML);
      expect(error.filePath).toBeUndefined();
      expect(error.cause).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
    
    test('creates YAML error with file path', () => {
      const error = new YAMLParseError('Invalid YAML syntax', {
        filePath: '/path/to/file.yaml'
      });
      
      expect(error.message).toBe('Invalid YAML syntax');
      expect(error.code).toBe(ErrorCode.INVALID_YAML);
      expect(error.filePath).toBe('/path/to/file.yaml');
    });
    
    test('creates YAML error with cause', () => {
      const cause = new Error('Original YAML error');
      const error = new YAMLParseError('Invalid YAML syntax', {
        cause
      });
      
      expect(error.message).toBe('Invalid YAML syntax');
      expect(error.cause).toBe(cause);
    });
    
    test('creates YAML error with context', () => {
      const context = { line: 42, column: 10 };
      const error = new YAMLParseError('Invalid YAML syntax', {
        context
      });
      
      expect(error.message).toBe('Invalid YAML syntax');
      expect(error.context).toEqual(context);
    });
    
    test('creates YAML error with all options', () => {
      const cause = new Error('Original YAML error');
      const context = { line: 42, column: 10 };
      const error = new YAMLParseError('Invalid YAML syntax', {
        filePath: '/path/to/file.yaml',
        cause,
        context
      });
      
      expect(error.message).toBe('Invalid YAML syntax');
      expect(error.code).toBe(ErrorCode.INVALID_YAML);
      expect(error.filePath).toBe('/path/to/file.yaml');
      expect(error.cause).toBe(cause);
      expect(error.context).toEqual(context);
    });
  });
  
  describe('JSONParseError', () => {
    test('creates JSON error with default options', () => {
      const error = new JSONParseError('Invalid JSON syntax');
      
      expect(error).toBeInstanceOf(JSONParseError);
      expect(error).toBeInstanceOf(FileError);
      expect(error.message).toBe('Invalid JSON syntax');
      expect(error.code).toBe(ErrorCode.INVALID_JSON);
      expect(error.filePath).toBeUndefined();
      expect(error.cause).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
    
    test('creates JSON error with file path', () => {
      const error = new JSONParseError('Invalid JSON syntax', {
        filePath: '/path/to/file.json'
      });
      
      expect(error.message).toBe('Invalid JSON syntax');
      expect(error.code).toBe(ErrorCode.INVALID_JSON);
      expect(error.filePath).toBe('/path/to/file.json');
    });
    
    test('creates JSON error with cause', () => {
      const cause = new Error('Original JSON error');
      const error = new JSONParseError('Invalid JSON syntax', {
        cause
      });
      
      expect(error.message).toBe('Invalid JSON syntax');
      expect(error.cause).toBe(cause);
    });
    
    test('creates JSON error with context', () => {
      const context = { position: 157 };
      const error = new JSONParseError('Invalid JSON syntax', {
        context
      });
      
      expect(error.message).toBe('Invalid JSON syntax');
      expect(error.context).toEqual(context);
    });
    
    test('creates JSON error with all options', () => {
      const cause = new Error('Original JSON error');
      const context = { position: 157 };
      const error = new JSONParseError('Invalid JSON syntax', {
        filePath: '/path/to/file.json',
        cause,
        context
      });
      
      expect(error.message).toBe('Invalid JSON syntax');
      expect(error.code).toBe(ErrorCode.INVALID_JSON);
      expect(error.filePath).toBe('/path/to/file.json');
      expect(error.cause).toBe(cause);
      expect(error.context).toEqual(context);
    });
  });
  
  describe('Error Integration', () => {
    test('can catch FileError by instance', () => {
      try {
        throw new FileError('Test error', { code: ErrorCode.FILE_READ_ERROR });
      } catch (error) {
        expect(error).toBeInstanceOf(FileError);
        expect(error).not.toBeInstanceOf(YAMLParseError);
        expect(error).not.toBeInstanceOf(JSONParseError);
      }
    });
    
    test('can catch YAMLParseError by instance', () => {
      try {
        throw new YAMLParseError('Test YAML error');
      } catch (error) {
        expect(error).toBeInstanceOf(FileError); // It's also a FileError
        expect(error).toBeInstanceOf(YAMLParseError);
        expect(error).not.toBeInstanceOf(JSONParseError);
      }
    });
    
    test('can catch JSONParseError by instance', () => {
      try {
        throw new JSONParseError('Test JSON error');
      } catch (error) {
        expect(error).toBeInstanceOf(FileError); // It's also a FileError
        expect(error).not.toBeInstanceOf(YAMLParseError);
        expect(error).toBeInstanceOf(JSONParseError);
      }
    });
    
    test('stack trace is preserved', () => {
      const error = new YAMLParseError('Error with stack');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Error with stack');
    });
  });
}); 