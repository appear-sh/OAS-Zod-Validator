import { PathsObject, PathItemObject, OperationObject } from '../paths';
import { describe, test, expect } from '@jest/globals';

describe('Paths Schema Validation', () => {
  describe('OperationObject', () => {
    test('validates complete operation', () => {
      const operation = {
        tags: ['users'],
        summary: 'Create user',
        description: 'Creates a new user',
        operationId: 'createUser',
        parameters: [
          {
            name: 'username',
            in: 'query',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },
        security: [{ bearerAuth: [] }]
      };
      
      expect(() => OperationObject.parse(operation)).not.toThrow();
    });

    test('validates minimal operation', () => {
      const operation = {
        responses: {
          '200': {
            description: 'OK'
          }
        }
      };
      
      expect(() => OperationObject.parse(operation)).not.toThrow();
    });
  });

  describe('PathItemObject', () => {
    test('validates complete path item', () => {
      const pathItem = {
        summary: 'User operations',
        description: 'Endpoints for user management',
        parameters: [
          {
            name: 'tenant',
            in: 'header',
            required: true,
            schema: { type: 'string' }
          }
        ],
        get: {
          responses: {
            '200': { description: 'OK' }
          }
        },
        post: {
          responses: {
            '201': { description: 'Created' }
          }
        }
      };
      
      expect(() => PathItemObject.parse(pathItem)).not.toThrow();
    });

    test('validates path item with references', () => {
      const pathItem = {
        $ref: '#/components/pathItems/UserPath',
        get: {
          responses: {
            '200': { description: 'OK' }
          }
        }
      };
      
      expect(() => PathItemObject.parse(pathItem)).not.toThrow();
    });
  });

  describe('PathsObject', () => {
    test('validates complete paths object', () => {
      const paths = {
        '/users': {
          get: {
            responses: {
              '200': { description: 'List users' }
            }
          }
        },
        '/users/{id}': {
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          get: {
            responses: {
              '200': { description: 'Get user' }
            }
          }
        }
      };
      
      expect(() => PathsObject.parse(paths)).not.toThrow();
    });

    test('validates empty paths object', () => {
      expect(() => PathsObject.parse({})).not.toThrow();
    });

    test('rejects invalid path patterns', () => {
      const invalidPaths = {
        'users': {}, // Missing leading slash
        '/{param}': {}, // Path parameter not in middle or end
        '/path//invalid': {} // Double slash
      };
      
      expect(() => PathsObject.parse(invalidPaths)).toThrow();
    });
  });
});
