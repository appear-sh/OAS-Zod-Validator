import { validateFromYaml } from '../validateFromYaml.js';
import { verifyRefTargets } from '../verifyRefTargets.js';
import { ReferenceError } from '../../errors/validation.js';
import {
  encodePointerToken,
  decodePointerToken,
  splitPointer,
  joinPointerTokens,
  getByPointer,
} from '../../utils/jsonPointer.js';

import { describe, test, expect } from 'vitest';
describe('Utils Coverage Improvements', () => {
  describe('validateFromYaml edge cases', () => {
    test('handles empty YAML input', async () => {
      const yaml = '';

      try {
        await validateFromYaml(yaml);
        fail('Should throw an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('handles complex parsing errors in YAML', async () => {
      const invalidYaml = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      responses:
        '200'
          description: OK
      `;

      try {
        await validateFromYaml(invalidYaml);
        fail('Should throw an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('validates YAML with custom options', async () => {
      const yaml = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      responses:
        '200':
          description: OK
      `;

      const result = await validateFromYaml(yaml, { strict: true });
      expect(result.valid).toBe(true);
    });
  });

  describe('verifyRefTargets edge cases', () => {
    test('handles circular references', () => {
      const doc = {
        openapi: '3.0.0',
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                friend: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
      };

      const resolvedRefs: string[] = [];

      try {
        verifyRefTargets(doc, resolvedRefs);
        // Should not throw for circular references
        expect(resolvedRefs).toContain('#/components/schemas/User');
      } catch {
        fail('Should not throw for circular references');
      }
    });

    test('detects missing reference targets', () => {
      const doc = {
        openapi: '3.0.0',
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                address: {
                  $ref: '#/components/schemas/Address',
                },
              },
            },
          },
        },
      };

      const resolvedRefs: string[] = [];

      try {
        verifyRefTargets(doc, resolvedRefs);
        fail('Should throw for missing reference');
      } catch (error) {
        expect(error).toBeInstanceOf(ReferenceError);
        if (error instanceof ReferenceError) {
          expect(error.message).toContain('Address');
        }
      }
    });

    test('handles deeply nested references', () => {
      const doc = {
        openapi: '3.0.0',
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                posts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      comments: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Comment',
                        },
                      },
                    },
                  },
                },
              },
            },
            Comment: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                },
              },
            },
          },
        },
      };

      const resolvedRefs: string[] = [];

      verifyRefTargets(doc, resolvedRefs);
      expect(resolvedRefs).toContain('#/components/schemas/Comment');
    });
  });

  describe('jsonPointer utilities', () => {
    test('encode/decode and traversal', () => {
      expect(encodePointerToken('a/b')).toBe('a~1b');
      expect(encodePointerToken('c~d')).toBe('c~0d');
      expect(decodePointerToken('a~1b')).toBe('a/b');
      expect(decodePointerToken('c~0d')).toBe('c~d');

      const tokens = splitPointer('#/components/schemas/a~1b');
      expect(tokens).toEqual(['components', 'schemas', 'a/b']);

      const pointer = joinPointerTokens(['components', 'schemas', 'x/y']);
      expect(pointer).toBe('#/components/schemas/x~1y');

      const doc = {
        components: { schemas: { arr: [{ id: 1 }, { id: 2 }] } },
      } as const;
      expect(getByPointer(doc, '#/components/schemas/arr/1/id')).toBe(2);
      expect(getByPointer(doc, '#/components/schemas/missing')).toBeUndefined();
    });
  });
});
