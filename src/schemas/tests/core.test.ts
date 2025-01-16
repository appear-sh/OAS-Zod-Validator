import { ReferenceObject } from '../core';
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
});