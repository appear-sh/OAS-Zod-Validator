import { describe, it, expect } from 'vitest';
import {
  formatMessage,
  enhanceZodIssue,
  groupErrorsByCategory,
  sortErrors,
} from '../messages.js';
import { ValidationErrorCode } from '../codes.js';

describe('messages utilities', () => {
  describe('formatMessage', () => {
    it('replaces placeholders with values', () => {
      const result = formatMessage(
        'Expected {{expected}}, received {{received}}',
        {
          expected: 'string',
          received: 'number',
        }
      );
      expect(result).toBe('Expected string, received number');
    });

    it('handles missing placeholders gracefully', () => {
      const result = formatMessage('No placeholders here', {});
      expect(result).toBe('No placeholders here');
    });

    it('replaces multiple occurrences of same placeholder', () => {
      const result = formatMessage('{{val}} and {{val}}', { val: 'test' });
      expect(result).toBe('test and test');
    });
  });

  describe('enhanceZodIssue', () => {
    it('maps invalid_type with undefined received to REQUIRED_FIELD', () => {
      const enhanced = enhanceZodIssue({
        code: 'invalid_type',
        path: ['info', 'title'],
        message: 'Required',
        expected: 'string',
        received: 'undefined',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.REQUIRED_FIELD);
      expect(enhanced.category).toBe('schema');
    });

    it('maps invalid_type with actual type mismatch to INVALID_TYPE', () => {
      const enhanced = enhanceZodIssue({
        code: 'invalid_type',
        path: ['info', 'title'],
        message: 'Expected string',
        expected: 'string',
        received: 'number',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.INVALID_TYPE);
    });

    it('maps invalid_string with email validation to INVALID_EMAIL', () => {
      const enhanced = enhanceZodIssue({
        code: 'invalid_string',
        path: ['email'],
        message: 'Invalid email',
        validation: 'email',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.INVALID_EMAIL);
      expect(enhanced.category).toBe('format');
    });

    it('maps invalid_union to INVALID_UNION', () => {
      const enhanced = enhanceZodIssue({
        code: 'invalid_union',
        path: ['schema'],
        message: 'Invalid union',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.INVALID_UNION);
    });

    it('maps unrecognized_keys to UNRECOGNIZED_KEYS', () => {
      const enhanced = enhanceZodIssue({
        code: 'unrecognized_keys',
        path: ['info'],
        message: 'Unrecognized keys',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.UNRECOGNIZED_KEYS);
    });

    it('maps custom to CUSTOM_VALIDATION_FAILED', () => {
      const enhanced = enhanceZodIssue({
        code: 'custom',
        path: ['field'],
        message: 'Custom error',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.CUSTOM_VALIDATION_FAILED);
    });

    it('maps too_small with origin=number to INVALID_MINIMUM', () => {
      const enhanced = enhanceZodIssue({
        code: 'too_small',
        path: ['count'],
        message: 'Too small',
        origin: 'number',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.INVALID_MINIMUM);
    });

    it('maps too_small with origin=string to INVALID_MIN_LENGTH', () => {
      const enhanced = enhanceZodIssue({
        code: 'too_small',
        path: ['name'],
        message: 'Too short',
        origin: 'string',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.INVALID_MIN_LENGTH);
    });

    it('maps too_big with origin=number to INVALID_MAXIMUM', () => {
      const enhanced = enhanceZodIssue({
        code: 'too_big',
        path: ['count'],
        message: 'Too big',
        origin: 'number',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.INVALID_MAXIMUM);
    });

    it('maps too_big with origin=string to INVALID_MAX_LENGTH', () => {
      const enhanced = enhanceZodIssue({
        code: 'too_big',
        path: ['name'],
        message: 'Too long',
        origin: 'string',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.INVALID_MAX_LENGTH);
    });

    it('includes spec link when specSection is defined', () => {
      const enhanced = enhanceZodIssue(
        {
          code: 'invalid_type',
          path: ['info'],
          message: 'Required',
          received: 'undefined',
        },
        '3.1.0'
      );
      expect(enhanced.specLink).toContain('appear.sh/api-toolkit/specs');
    });

    it('includes suggestion with placeholder replacement', () => {
      const enhanced = enhanceZodIssue({
        code: 'invalid_type',
        path: ['field'],
        message: 'Type error',
        expected: 'string',
        received: 'number',
      });
      expect(enhanced.suggestion).toContain('string');
      expect(enhanced.suggestion).toContain('number');
    });

    // Tests for new specific custom validation error codes
    it('maps custom "Object types must define..." to MISSING_OBJECT_SCHEMA', () => {
      const enhanced = enhanceZodIssue({
        code: 'custom',
        path: ['components', 'schemas', 'MySchema', 'properties'],
        message:
          'Object types must define either properties or additionalProperties',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.MISSING_OBJECT_SCHEMA);
      expect(enhanced.category).toBe('schema');
      expect(enhanced.suggestion).toContain('properties');
      expect(enhanced.suggestion).toContain('additionalProperties');
    });

    it('maps custom "Array types must define items" to MISSING_ARRAY_ITEMS', () => {
      const enhanced = enhanceZodIssue({
        code: 'custom',
        path: ['components', 'schemas', 'MyArray', 'items'],
        message: 'Array types must define items',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.MISSING_ARRAY_ITEMS);
      expect(enhanced.category).toBe('schema');
      expect(enhanced.suggestion).toContain('items');
    });

    it('maps custom type/keyword mismatch to TYPE_KEYWORD_MISMATCH', () => {
      const enhanced = enhanceZodIssue({
        code: 'custom',
        path: ['components', 'schemas', 'Test', 'minLength'],
        message: 'minLength can only be used with string type',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.TYPE_KEYWORD_MISMATCH);
      expect(enhanced.category).toBe('schema');
    });

    it('maps custom example errors to INVALID_EXAMPLE_VALUE', () => {
      const enhanced = enhanceZodIssue({
        code: 'custom',
        path: ['components', 'schemas', 'Test', 'example'],
        message: 'Example value 100 does not conform to the int32 format',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.INVALID_EXAMPLE_VALUE);
      expect(enhanced.category).toBe('schema');
      expect(enhanced.suggestion).toContain('example');
    });

    it('maps custom regex pattern error to INVALID_REGEX', () => {
      const enhanced = enhanceZodIssue({
        code: 'custom',
        path: ['components', 'schemas', 'Test', 'pattern'],
        message: 'Invalid regular expression pattern',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.INVALID_REGEX);
      expect(enhanced.category).toBe('pattern');
    });

    it('falls back to CUSTOM_VALIDATION_FAILED for unknown custom messages', () => {
      const enhanced = enhanceZodIssue({
        code: 'custom',
        path: ['some', 'path'],
        message: 'Some unknown custom validation failed',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.CUSTOM_VALIDATION_FAILED);
    });
  });

  describe('groupErrorsByCategory', () => {
    it('groups errors by category', () => {
      const errors = [
        { category: 'schema', code: 'ERR_001', path: ['a'] },
        { category: 'format', code: 'ERR_101', path: ['b'] },
        { category: 'schema', code: 'ERR_002', path: ['c'] },
      ];
      const grouped = groupErrorsByCategory(errors);
      expect(grouped.schema).toHaveLength(2);
      expect(grouped.format).toHaveLength(1);
    });

    it('handles empty array', () => {
      const grouped = groupErrorsByCategory([]);
      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });

  describe('sortErrors', () => {
    it('sorts ERR_ codes before other codes', () => {
      const errors = [
        { code: 'OTHER', path: ['a'] },
        { code: 'ERR_001', path: ['b'] },
      ];
      const sorted = sortErrors(errors);
      expect(sorted[0].code).toBe('ERR_001');
    });

    it('sorts by path length (longer paths first)', () => {
      const errors = [
        { code: 'ERR_001', path: ['a'] },
        { code: 'ERR_002', path: ['a', 'b', 'c'] },
      ];
      const sorted = sortErrors(errors);
      expect(sorted[0].path).toHaveLength(3);
    });

    it('sorts alphabetically by code when path lengths equal', () => {
      const errors = [
        { code: 'ERR_002', path: ['a'] },
        { code: 'ERR_001', path: ['b'] },
      ];
      const sorted = sortErrors(errors);
      expect(sorted[0].code).toBe('ERR_001');
    });
  });
});
