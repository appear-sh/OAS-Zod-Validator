import { validateFromYaml } from '../utils/validateFromYaml';
import { verifyRefTargets } from '../utils/verifyRefTargets';

describe('YAML Validation', () => {
  test('validates yaml string', () => {
    const yaml = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      paths: {}
    `;
    const result = validateFromYaml(yaml);
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
    expect(() => verifyRefTargets(doc, refs)).not.toThrow();
  });
});
