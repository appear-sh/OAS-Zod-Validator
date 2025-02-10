import { ParameterObject } from '../paths.js';
import { describe, test, expect } from '@jest/globals';

describe('Parameter Object Validation', () => {
  test('validates path parameter', () => {
    const param = {
      name: 'userId',
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      }
    };
    
    expect(() => ParameterObject.parse(param)).not.toThrow();
  });

  test('validates query parameter', () => {
    const param = {
      name: 'filter',
      in: 'query',
      schema: {
        type: 'string',
        enum: ['active', 'inactive']
      }
    };
    
    expect(() => ParameterObject.parse(param)).not.toThrow();
  });

  test('validates header parameter', () => {
    const param = {
      name: 'X-API-Version',
      in: 'header',
      required: true,
      schema: {
        type: 'string',
        pattern: '^\\d+\\.\\d+\\.\\d+$'
      }
    };
    
    expect(() => ParameterObject.parse(param)).not.toThrow();
  });

  test('validates cookie parameter', () => {
    const param = {
      name: 'sessionId',
      in: 'cookie',
      schema: {
        type: 'string'
      }
    };
    
    expect(() => ParameterObject.parse(param)).not.toThrow();
  });

  test('enforces required true for path parameters', () => {
    const param = {
      name: 'userId',
      in: 'path',
      required: false, // This should fail
      schema: {
        type: 'string'
      }
    };
    
    expect(() => ParameterObject.parse(param)).toThrow();
  });

  test('validates parameter with content', () => {
    const param = {
      name: 'payload',
      in: 'query',
      schema: {
        type: 'object',
        properties: {
          filter: { type: 'string' }
        }
      }
    };
    
    expect(() => ParameterObject.parse(param)).not.toThrow();
  });
});