import { describe, test, expect } from '@jest/globals';
import {
  createOpenAPIVersion,
  createJSONPointer,
  createPathParam,
  createAPIURL,
  createContentType,
  OpenAPIVersion,
  JSONPointer,
  PathParam,
  APIURL,
  ContentType
} from '../branded.js';

describe('Branded Types', () => {
  describe('OpenAPIVersion', () => {
    test('validates correct OpenAPI version formats', () => {
      // Test valid formats
      const validVersions = [
        '3.0.0',
        '3.0.1',
        '3.1.0',
        '3.2',
        '3.0',
        '3.1'
      ];
      
      validVersions.forEach(version => {
        const brandedVersion = createOpenAPIVersion(version);
        expect(typeof brandedVersion).toBe('string');
        expect(brandedVersion).toBe(version);
      });
    });
    
    test('rejects invalid OpenAPI version formats', () => {
      // Test invalid formats
      const invalidVersions = [
        '2.0.0',
        '4.0.0',
        'abc',
        '',
        '3',
        '3.0.0.0'
      ];
      
      invalidVersions.forEach(version => {
        expect(() => createOpenAPIVersion(version)).toThrow();
        expect(() => createOpenAPIVersion(version)).toThrow(`Invalid OpenAPI version format: ${version}`);
      });
    });
    
    test('type compatibility with string operations', () => {
      const version = createOpenAPIVersion('3.0.0');
      
      // Should work with string operations
      expect(version.startsWith('3')).toBe(true);
      expect(version.includes('0')).toBe(true);
      expect(version.split('.')).toEqual(['3', '0', '0']);
      
      // Type assertions
      const assertedVersion: OpenAPIVersion = version;
      const stringVersion: string = version;
      
      expect(assertedVersion).toBe(stringVersion);
    });
  });
  
  describe('JSONPointer', () => {
    test('validates correct JSON pointer formats', () => {
      // Test valid formats
      const validPointers = [
        '#/components/schemas/Pet',
        '#/paths/pet',
        '/components/schemas/Pet',
        '/paths/pet'
      ];
      
      validPointers.forEach(pointer => {
        const brandedPointer = createJSONPointer(pointer);
        expect(typeof brandedPointer).toBe('string');
        expect(brandedPointer).toBe(pointer);
      });
    });
    
    test('rejects invalid JSON pointer formats', () => {
      // Test invalid formats
      const invalidPointers = [
        'components/schemas/Pet',
        'pet',
        '',
        'http://example.com'
      ];
      
      invalidPointers.forEach(pointer => {
        expect(() => createJSONPointer(pointer)).toThrow();
        expect(() => createJSONPointer(pointer)).toThrow(`Invalid JSON pointer format: ${pointer}`);
      });
    });
    
    test('type compatibility with string operations', () => {
      const pointer = createJSONPointer('#/components/schemas/Pet');
      
      // Should work with string operations
      expect(pointer.startsWith('#/')).toBe(true);
      expect(pointer.includes('schemas')).toBe(true);
      expect(pointer.split('/')).toHaveLength(4);
      
      // Type assertions
      const assertedPointer: JSONPointer = pointer;
      const stringPointer: string = pointer;
      
      expect(assertedPointer).toBe(stringPointer);
    });
  });
  
  describe('PathParam', () => {
    test('creates path parameter branded type', () => {
      // Test various path parameters
      const params = [
        '{id}',
        '{petId}',
        '{userId}',
        'simple'
      ];
      
      params.forEach(param => {
        const brandedParam = createPathParam(param);
        expect(typeof brandedParam).toBe('string');
        expect(brandedParam).toBe(param);
      });
    });
    
    test('type compatibility with string operations', () => {
      const param = createPathParam('{id}');
      
      // Should work with string operations
      expect(param.startsWith('{')).toBe(true);
      expect(param.endsWith('}')).toBe(true);
      expect(param.replace(/[{}]/g, '')).toBe('id');
      
      // Type assertions
      const assertedParam: PathParam = param;
      const stringParam: string = param;
      
      expect(assertedParam).toBe(stringParam);
    });
  });
  
  describe('APIURL', () => {
    test('validates correct URL formats', () => {
      // Test valid URLs
      const validURLs = [
        'https://api.example.com',
        'http://localhost:3000',
        'https://api.example.com/v1/pets',
        'http://localhost:3000/api'
      ];
      
      validURLs.forEach(url => {
        const brandedURL = createAPIURL(url);
        expect(typeof brandedURL).toBe('string');
        expect(brandedURL).toBe(url);
      });
    });
    
    test('rejects invalid URL formats', () => {
      // Test invalid URLs
      const invalidURLs = [
        'not a url',
        'example.com',
        '://example.com',
        ''
      ];
      
      invalidURLs.forEach(url => {
        expect(() => createAPIURL(url)).toThrow();
        expect(() => createAPIURL(url)).toThrow(`Invalid URL format: ${url}`);
      });
    });
    
    test('type compatibility with string operations', () => {
      const url = createAPIURL('https://api.example.com');
      
      // Should work with string operations
      expect(url.startsWith('https')).toBe(true);
      expect(url.includes('example')).toBe(true);
      expect(url.split('://')[1]).toBe('api.example.com');
      
      // Type assertions
      const assertedURL: APIURL = url;
      const stringURL: string = url;
      
      expect(assertedURL).toBe(stringURL);
    });
  });
  
  describe('ContentType', () => {
    test('creates content type branded type', () => {
      // Test various content types
      const contentTypes = [
        'application/json',
        'application/xml',
        'text/plain',
        'multipart/form-data'
      ];
      
      contentTypes.forEach(contentType => {
        const brandedContentType = createContentType(contentType);
        expect(typeof brandedContentType).toBe('string');
        expect(brandedContentType).toBe(contentType);
      });
    });
    
    test('type compatibility with string operations', () => {
      const contentType = createContentType('application/json');
      
      // Should work with string operations
      expect(contentType.startsWith('application')).toBe(true);
      expect(contentType.includes('json')).toBe(true);
      expect(contentType.split('/')).toEqual(['application', 'json']);
      
      // Type assertions
      const assertedContentType: ContentType = contentType;
      const stringContentType: string = contentType;
      
      expect(assertedContentType).toBe(stringContentType);
    });
  });
}); 