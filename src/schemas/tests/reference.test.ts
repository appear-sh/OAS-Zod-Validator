import { ReferenceObject, isReferenceObject, validateReference } from '../reference.js';
import { describe, test, expect } from '@jest/globals';

describe('Reference Object Validation', () => {
  test('validates correct reference format', () => {
    const validRef = { $ref: '#/components/schemas/User' };
    expect(() => ReferenceObject.parse(validRef)).not.toThrow();
  });

  test('rejects invalid reference format', () => {
    const invalidRef = { $ref: 'invalid/ref' };
    expect(() => ReferenceObject.parse(invalidRef)).toThrow();
  });

  test('rejects additional properties', () => {
    const refWithExtra = { 
      $ref: '#/components/schemas/User',
      extra: 'property'
    };
    expect(() => ReferenceObject.parse(refWithExtra)).toThrow();
  });
});

describe('isReferenceObject', () => {
  test('identifies valid reference objects', () => {
    expect(isReferenceObject({ $ref: '#/components/schemas/User' })).toBe(true);
  });

  test('rejects non-objects', () => {
    expect(isReferenceObject(null)).toBe(false);
    expect(isReferenceObject(undefined)).toBe(false);
    expect(isReferenceObject('string')).toBe(false);
  });

  test('rejects objects without $ref', () => {
    expect(isReferenceObject({})).toBe(false);
    expect(isReferenceObject({ other: 'property' })).toBe(false);
  });

  test('rejects objects with non-string $ref', () => {
    expect(isReferenceObject({ $ref: 123 })).toBe(false);
    expect(isReferenceObject({ $ref: {} })).toBe(false);
  });
});

describe('validateReference', () => {
  test('validates correct reference strings', () => {
    expect(validateReference('#/components/schemas/User')).toBe(true);
    expect(validateReference('#/paths/user/get')).toBe(true);
  });

  test('rejects invalid reference strings', () => {
    expect(validateReference('invalid/ref')).toBe(false);
    expect(validateReference('#/invalid/path')).toBe(false);
    expect(validateReference('')).toBe(false);
  });
});
