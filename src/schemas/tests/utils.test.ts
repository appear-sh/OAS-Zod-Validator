import { validateOpenAPI } from '../validator';
import { describe, test, expect } from '@jest/globals';
import yaml from 'js-yaml';

describe('YAML Validation', () => {
  test('validates yaml string', () => {
    const yamlStr = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      paths: {}
    `;
    const doc = yaml.load(yamlStr);
    const result = validateOpenAPI(doc);
    expect(result.valid).toBe(true);
  });
});

describe('Reference Target Verification', () => {
  test('verifies valid references', () => {
    const doc = {
      components: {
        schemas: {
          User: { type: 'object' }
        }
      }
    };
    const refs = ['#/components/schemas/User'];
    const result = validateOpenAPI(doc);
    expect(result.valid).toBe(true);
    expect(result.resolvedRefs).toContain(refs[0]);
  });
});
