import {
  PathsObject,
  PathItemObject,
  OperationObject,
  ParameterObject,
} from '../paths.js';

import { describe, test, expect } from 'vitest';

describe('Paths Coverage Improvements', () => {
  // Focus on branch coverage for line 200

  describe('path validation edge cases', () => {
    test('validates path with mixed operation types and non-standard fields', () => {
      const pathItem = {
        get: {
          operationId: 'getResource',
          responses: {
            '200': {
              description: 'OK',
            },
          },
        },
        post: {
          operationId: 'createResource',
          responses: {
            '201': {
              description: 'Created',
            },
          },
        },
        // Add non-standard fields that should be allowed as extensions
        'x-controller': 'ResourceController',
        'x-middleware': ['auth', 'logging'],
      };

      const result = PathItemObject.safeParse(pathItem);
      expect(result.success).toBe(true);
    });

    test('validates path with complex parameter combinations', () => {
      const pathItem = {
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'filter',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
        ],
        get: {
          parameters: [
            {
              name: 'fields',
              in: 'query',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'OK',
            },
          },
        },
      };

      const result = PathItemObject.safeParse(pathItem);
      expect(result.success).toBe(true);
    });

    test('validates operation with deprecated flag', () => {
      const operation = {
        operationId: 'getLegacyResource',
        deprecated: true,
        responses: {
          '200': {
            description: 'OK',
          },
        },
      };

      const result = OperationObject.safeParse(operation);
      expect(result.success).toBe(true);
    });

    test('validates complex path patterns with path params', () => {
      const paths = {
        '/resources': {
          get: {
            operationId: 'getResources',
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
        '/resources/{id}/sub-resources/{subId}': {
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
            {
              name: 'subId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          get: {
            operationId: 'getSubResource',
            responses: {
              '200': {
                description: 'OK',
              },
            },
          },
        },
      };

      const result = PathsObject.safeParse(paths);
      expect(result.success).toBe(true);
    });

    test('validates parameter with complex schema', () => {
      const parameter = {
        name: 'filter',
        in: 'query',
        schema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
            },
            category: {
              type: 'string',
            },
          },
          additionalProperties: false,
        },
      };

      const result = ParameterObject.safeParse(parameter);
      expect(result.success).toBe(true);
    });
  });
});
