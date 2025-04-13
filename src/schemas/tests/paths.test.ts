import { PathsObject, PathItemObject, OperationObject, ParameterObject } from '../paths.js';
import { describe, test, expect } from 'vitest';

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
    
    test('rejects operation with invalid operationId', () => {
      const operation = {
        operationId: 'create-user', // Contains hyphen
        responses: {
          '200': {
            description: 'OK'
          }
        }
      };
      
      expect(() => OperationObject.parse(operation)).toThrow();
      expect(() => OperationObject.parse(operation)).toThrow(/operationId must start with lowercase letter and contain only alphanumeric characters/);
    });
    
    test('rejects operation with too many parameters', () => {
      // Create an operation with 51 parameters (exceeding the limit of 50)
      const parameters = Array.from({ length: 51 }, (_, i) => ({
        name: `param${i}`,
        in: 'query',
        schema: { type: 'string' }
      }));
      
      const operation = {
        parameters,
        responses: {
          '200': {
            description: 'OK'
          }
        }
      };
      
      expect(() => OperationObject.parse(operation)).toThrow();
      expect(() => OperationObject.parse(operation)).toThrow(/Too many parameters/);
    });
    
    test('rejects operation with no responses', () => {
      const operation = {
        responses: {}
      };
      
      expect(() => OperationObject.parse(operation)).toThrow();
      expect(() => OperationObject.parse(operation)).toThrow(/At least one response must be defined/);
    });
    
    test('rejects operation with invalid response code', () => {
      const operation = {
        responses: {
          '600': { // Invalid HTTP status code
            description: 'Invalid'
          }
        }
      };
      
      expect(() => OperationObject.parse(operation)).toThrow();
      expect(() => OperationObject.parse(operation)).toThrow(/Response status code must be a valid HTTP status code/);
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
    
    test('rejects path item with no operations', () => {
      const pathItem = {
        summary: 'Empty path item',
        description: 'No operations defined'
        // No operations defined
      };
      
      expect(() => PathItemObject.parse(pathItem)).toThrow();
      expect(() => PathItemObject.parse(pathItem)).toThrow(/Path item must define at least one operation/);
    });
    
    test('validates path item with server url', () => {
      const pathItem = {
        servers: [
          {
            url: 'https://api.example.com',
            description: 'Production server'
          }
        ],
        get: {
          responses: {
            '200': { description: 'OK' }
          }
        }
      };
      
      expect(() => PathItemObject.parse(pathItem)).not.toThrow();
    });
    
    test('rejects path item with invalid server url', () => {
      const pathItem = {
        servers: [
          {
            url: 'invalid-url', // Not a valid URL
            description: 'Invalid server'
          }
        ],
        get: {
          responses: {
            '200': { description: 'OK' }
          }
        }
      };
      
      expect(() => PathItemObject.parse(pathItem)).toThrow();
      expect(() => PathItemObject.parse(pathItem)).toThrow(/Server URL must be a valid URL/);
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
    
    test('rejects paths with duplicate path parameters', () => {
      // This test specifically targets the branch in line 129
      const pathsWithDuplicateParams = {
        '/users/{id}/posts': {
          get: {
            responses: {
              '200': { description: 'Get user posts' }
            }
          }
        },
        '/posts/{id}': {  // Duplicate {id} parameter across paths
          get: {
            responses: {
              '200': { description: 'Get post' }
            }
          }
        }
      };
      
      expect(() => PathsObject.parse(pathsWithDuplicateParams)).toThrow();
      expect(() => PathsObject.parse(pathsWithDuplicateParams)).toThrow(/Path parameters must be unique/);
    });
    
    test('validates paths with non-duplicate parameters', () => {
      const pathsWithUniqueParams = {
        '/users/{userId}': {
          parameters: [
            {
              name: 'userId',
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
        },
        '/posts/{postId}': {  // Different parameter name
          parameters: [
            {
              name: 'postId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          get: {
            responses: {
              '200': { description: 'Get post' }
            }
          }
        }
      };
      
      expect(() => PathsObject.parse(pathsWithUniqueParams)).not.toThrow();
    });
    
    test('validates paths with multiple parameters in one path', () => {
      const pathsWithMultipleParams = {
        '/users/{userId}/posts/{postId}': {
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'postId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          get: {
            responses: {
              '200': { description: 'Get user post' }
            }
          }
        }
      };
      
      expect(() => PathsObject.parse(pathsWithMultipleParams)).not.toThrow();
    });
    
    test('validates paths with query parameter definitions', () => {
      const pathsWithQueryParams = {
        '/search': {
          get: {
            parameters: [
              {
                name: 'q',
                in: 'query',
                schema: { type: 'string' }
              }
            ],
            responses: {
              '200': { description: 'Search results' }
            }
          }
        }
      };
      
      expect(() => PathsObject.parse(pathsWithQueryParams)).not.toThrow();
    });
  });
  
  describe('ParameterObject', () => {
    test('validates path parameter', () => {
      const param = {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' }
      };
      
      expect(() => ParameterObject.parse(param)).not.toThrow();
    });
    
    test('rejects path parameter without required=true', () => {
      const param = {
        name: 'id',
        in: 'path',
        required: false, // Path parameters must be required
        schema: { type: 'string' }
      };
      
      expect(() => ParameterObject.parse(param)).toThrow();
    });
    
    test('validates query parameter', () => {
      const param = {
        name: 'filter',
        in: 'query',
        schema: { type: 'string' }
      };
      
      expect(() => ParameterObject.parse(param)).not.toThrow();
    });
    
    test('validates header parameter with valid name', () => {
      const param = {
        name: 'X-API-Key',
        in: 'header',
        schema: { type: 'string' }
      };
      
      expect(() => ParameterObject.parse(param)).not.toThrow();
    });
    
    test('rejects header parameter with invalid name', () => {
      const param = {
        name: 'X_API_Key%', // Contains invalid characters
        in: 'header',
        schema: { type: 'string' }
      };
      
      expect(() => ParameterObject.parse(param)).toThrow();
      expect(() => ParameterObject.parse(param)).toThrow(/Header parameter names should contain only alphanumeric characters and hyphens/);
    });
    
    test('validates cookie parameter', () => {
      const param = {
        name: 'session',
        in: 'cookie',
        schema: { type: 'string' }
      };
      
      expect(() => ParameterObject.parse(param)).not.toThrow();
    });
  });
});
