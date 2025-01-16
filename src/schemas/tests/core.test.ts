import { ExtensibleObject, ReferenceObject, VendorExtensible } from '../core';
import { describe, test, expect } from '@jest/globals';
import { z } from 'zod';

describe('Core Schema Types', () => {
  describe('ReferenceObject', () => {
    test('validates correct references', () => {
      const validRefs = [
        { $ref: '#/components/schemas/User' },
        { $ref: '#/components/responses/Error' },
        { $ref: '#/paths/user/get' }
      ];
      
      validRefs.forEach(ref => {
        expect(() => ReferenceObject.parse(ref)).not.toThrow();
      });
    });

    test('rejects invalid references', () => {
      const invalidRefs = [
        { $ref: 'not-a-ref' },
        { $ref: '#invalid' },
        { $ref: '#/invalid/path' },
        { $ref: '' }
      ];
      
      invalidRefs.forEach(ref => {
        expect(() => ReferenceObject.parse(ref)).toThrow();
      });
    });

    test('provides helpful error messages', () => {
      try {
        ReferenceObject.parse({ $ref: 'invalid' });
      } catch (error) {
        if (error instanceof z.ZodError) {
          expect(error.errors[0].message).toContain('References must start with "#/"');
        } else {
          throw error;
        }
      }
    });
  });

  describe('ExtensibleObject', () => {
    test('allows x- prefixed extension fields', () => {
      const obj = {
        'x-custom-field': 'value',
        'x-another-field': 123,
        'x-object-field': { nested: true }
      };
      expect(() => VendorExtensible.parse(obj)).not.toThrow();
    });

    test('handles non x- prefixed fields', () => {
      const obj = {
        'invalid-field': 'value',
        'another_invalid': 123,
        'normalField': true
      };
      const result = VendorExtensible.safeParse(obj);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Custom extensions must start with x-');
      }
    });

    test('allows mixed valid fields and extensions', () => {
      const obj = {
        type: 'string',
        format: 'email',
        'x-custom-validation': true
      };
      expect(() => ExtensibleObject.parse(obj)).not.toThrow();
    });
  });
});