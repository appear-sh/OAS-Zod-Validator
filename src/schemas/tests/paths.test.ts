import { PathsObject, PathItemObject, OperationObject, ParameterObject } from '../paths';
import { z } from 'zod';
import { describe, test, expect } from '@jest/globals';

describe('Paths Validation', () => {
  describe('Parameter Object', () => {
    test('validates path parameters require required=true', () => {
      const pathParam = {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' }
      };

      expect(() => ParameterObject.parse(pathParam)).not.toThrow();

      const invalidPathParam = {
        ...pathParam,
        required: false
      };

      expect(() => ParameterObject.parse(invalidPathParam)).toThrow();
    });

    test('validates header parameter names', () => {
      const validHeader = {
        name: 'X-Custom-Header',
        in: 'header',
        schema: { type: 'string' }
      };

      const invalidHeader = {
        name: 'Invalid Header!',
        in: 'header',
        schema: { type: 'string' }
      };

      expect(() => ParameterObject.parse(validHeader)).not.toThrow();
      expect(() => ParameterObject.parse(invalidHeader)).toThrow();
    });
  });

  describe('Operation Object', () => {
    test('validates operation ID format', () => {
      const operation = {
        operationId: 'getUserById',
        responses: {
          '200': {
            description: 'Success'
          }
        }
      };

      expect(() => OperationObject.parse(operation)).not.toThrow();

      const invalidOperation = {
        ...operation,
        operationId: 'get-user-by-id!'
      };

      expect(() => OperationObject.parse(invalidOperation)).toThrow();
    });

    test('validates response status codes', () => {
      const operation = {
        responses: {
          '200': { description: 'OK' },
          'default': { description: 'Default response' }
        }
      };

      expect(() => OperationObject.parse(operation)).not.toThrow();

      const invalidOperation = {
        responses: {
          '600': { description: 'Invalid status code' }
        }
      };

      expect(() => OperationObject.parse(invalidOperation)).toThrow();
    });

    test('requires at least one response', () => {
      const operation = {
        responses: {}
      };

      expect(() => OperationObject.parse(operation)).toThrow();
    });
  });

  describe('Path Item Object', () => {
    test('requires at least one operation', () => {
      const validPathItem = {
        get: {
          responses: {
            '200': { description: 'OK' }
          }
        }
      };

      const invalidPathItem = {
        parameters: []
      };

      expect(() => PathItemObject.parse(validPathItem)).not.toThrow();
      expect(() => PathItemObject.parse(invalidPathItem)).toThrow();
    });

    test('validates server URLs', () => {
      const pathItem = {
        get: {
          responses: {
            '200': { description: 'OK' }
          }
        },
        servers: [
          {
            url: 'https://api.example.com',
            description: 'Production'
          }
        ]
      };

      const invalidPathItem = {
        ...pathItem,
        servers: [
          {
            url: 'not-a-url',
            description: 'Invalid'
          }
        ]
      };

      expect(() => PathItemObject.parse(pathItem)).not.toThrow();
      expect(() => PathItemObject.parse(invalidPathItem)).toThrow();
    });
  });

  describe('Paths Object', () => {
    test('validates path format', () => {
      const paths = {
        '/users': {
          get: {
            responses: {
              '200': { description: 'OK' }
            }
          }
        }
      };

      const invalidPaths = {
        'users': { // Missing leading slash
          get: {
            responses: {
              '200': { description: 'OK' }
            }
          }
        }
      };

      expect(() => PathsObject.parse(paths)).not.toThrow();
      expect(() => PathsObject.parse(invalidPaths)).toThrow();
    });

    test('validates unique path parameters', () => {
      const paths = {
        '/users/{id}': {
          get: {
            responses: {
              '200': { description: 'OK' }
            }
          }
        },
        '/posts/{postId}': {
          get: {
            responses: {
              '200': { description: 'OK' }
            }
          }
        }
      };

      const invalidPaths = {
        '/users/{id}': {
          get: {
            responses: {
              '200': { description: 'OK' }
            }
          }
        },
        '/posts/{id}': { // Duplicate {id} parameter
          get: {
            responses: {
              '200': { description: 'OK' }
            }
          }
        }
      };

      expect(() => PathsObject.parse(paths)).not.toThrow();
      expect(() => PathsObject.parse(invalidPaths)).toThrow();
    });

    test('rejects paths with query parameters', () => {
      const invalidPaths = {
        '/users?sort=desc': {
          get: {
            responses: {
              '200': { description: 'OK' }
            }
          }
        }
      };

      expect(() => PathsObject.parse(invalidPaths)).toThrow();
    });
  });
});
