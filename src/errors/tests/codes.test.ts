import { describe, it, expect } from 'vitest';
import {
  ValidationErrorCode,
  ERROR_CODES,
  getErrorCodeInfo,
} from '../codes.js';

describe('error codes', () => {
  describe('ValidationErrorCode enum', () => {
    it('has schema validation codes starting with ERR_0xx', () => {
      expect(ValidationErrorCode.INVALID_TYPE).toBe('ERR_001');
      expect(ValidationErrorCode.REQUIRED_FIELD).toBe('ERR_002');
      expect(ValidationErrorCode.UNRECOGNIZED_KEYS).toBe('ERR_003');
    });

    it('has format validation codes starting with ERR_1xx', () => {
      expect(ValidationErrorCode.INVALID_FORMAT).toBe('ERR_101');
      expect(ValidationErrorCode.INVALID_EMAIL).toBe('ERR_104');
      expect(ValidationErrorCode.INVALID_URI).toBe('ERR_105');
    });

    it('has reference codes starting with ERR_2xx', () => {
      expect(ValidationErrorCode.INVALID_REFERENCE).toBe('ERR_201');
      expect(ValidationErrorCode.REFERENCE_NOT_FOUND).toBe('ERR_202');
      expect(ValidationErrorCode.CIRCULAR_REFERENCE).toBe('ERR_203');
    });
  });

  describe('ERROR_CODES map', () => {
    it('has metadata for all enum values', () => {
      const enumValues = Object.values(ValidationErrorCode);
      for (const code of enumValues) {
        expect(ERROR_CODES[code]).toBeDefined();
        expect(ERROR_CODES[code].code).toBe(code);
        expect(ERROR_CODES[code].category).toBeDefined();
        expect(ERROR_CODES[code].defaultMessage).toBeDefined();
      }
    });

    it('includes suggestions for most codes', () => {
      expect(ERROR_CODES[ValidationErrorCode.INVALID_TYPE].suggestion).toBeDefined();
      expect(ERROR_CODES[ValidationErrorCode.INVALID_EMAIL].suggestion).toContain('email');
    });
  });

  describe('getErrorCodeInfo', () => {
    it('returns info for valid error codes', () => {
      const info = getErrorCodeInfo('ERR_001');
      expect(info).toBeDefined();
      expect(info?.code).toBe(ValidationErrorCode.INVALID_TYPE);
      expect(info?.category).toBe('schema');
    });

    it('returns undefined for unknown codes', () => {
      const info = getErrorCodeInfo('UNKNOWN_CODE');
      expect(info).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      const info = getErrorCodeInfo('');
      expect(info).toBeUndefined();
    });
  });
});
