import { ReferenceObject } from '../core';
import { describe, test, expect } from '@jest/globals';

describe('Reference Object Validation', () => {
  test('validates correct reference format', () => {
    const validRef = { $ref: '#/components/schemas/User' };
    expect(() => ReferenceObject.parse(validRef)).not.toThrow();
  });

  test('rejects invalid reference format', () => {
    const invalidRef = { $ref: 'invalid-ref' };
    expect(() => ReferenceObject.parse(invalidRef)).toThrow();
  });
});
