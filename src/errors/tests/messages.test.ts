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
      const result = formatMessage('Expected {{expected}}, received {{received}}', {
        expected: 'string',
        received: 'number',
      });
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

    it('maps too_small to INVALID_MINIMUM', () => {
      const enhanced = enhanceZodIssue({
        code: 'too_small',
        path: ['count'],
        message: 'Too small',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.INVALID_MINIMUM);
    });

    it('maps too_big to INVALID_MAXIMUM', () => {
      const enhanced = enhanceZodIssue({
        code: 'too_big',
        path: ['count'],
        message: 'Too big',
      });
      expect(enhanced.code).toBe(ValidationErrorCode.INVALID_MAXIMUM);
    });

    it('includes spec link when specSection is defined', () => {
      const enhanced = enhanceZodIssue({
        code: 'invalid_type',
        path: ['info'],
        message: 'Required',
        received: 'undefined',
      }, '3.1.0');
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
