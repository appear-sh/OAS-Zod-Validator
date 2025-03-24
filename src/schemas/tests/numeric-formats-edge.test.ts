import { z } from 'zod';
import { describe, test, expect } from '@jest/globals';
import { 
  getNumericFormatDescription,
  isValidNumericLiteral
} from '../numeric-formats.js';

describe('Numeric Format Edge Cases', () => {
  describe('Additional tests for getNumericFormatDescription', () => {
    test('returns description for all format cases', () => {
      // Test all possible format values
      expect(getNumericFormatDescription('int32')).toBe(`32-bit integer (range: -2147483648 to 2147483647)`);
      expect(getNumericFormatDescription('int64')).toBe(`64-bit integer (range: ${Number.MIN_SAFE_INTEGER} to ${Number.MAX_SAFE_INTEGER})`);
      expect(getNumericFormatDescription('float')).toBe('32-bit floating-point number');
      expect(getNumericFormatDescription('double')).toBe('64-bit floating-point number');
      expect(getNumericFormatDescription('unknown')).toBe('number');
      expect(getNumericFormatDescription(undefined)).toBe('number');
    });
  });

  describe('Additional isValidNumericLiteral tests', () => {
    test('handles edge cases', () => {
      expect(isValidNumericLiteral('0')).toBe(true);
      expect(isValidNumericLiteral('-0')).toBe(true);
      expect(isValidNumericLiteral('Infinity')).toBe(false); // Infinity is not finite
      expect(isValidNumericLiteral('NaN')).toBe(false); // NaN is not a number
      expect(isValidNumericLiteral('123e5')).toBe(true); // Scientific notation
      expect(isValidNumericLiteral('0x123')).toBe(true); // Hex notation
      expect(isValidNumericLiteral('  123  ')).toBe(true); // Spaces
      expect(isValidNumericLiteral('123abc')).toBe(false); // Invalid numeric string
    });
  });
}); 