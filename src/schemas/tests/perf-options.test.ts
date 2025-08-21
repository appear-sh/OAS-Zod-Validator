import { describe, it, expect } from 'vitest';
import { validateOpenAPIDocument } from '../../schemas/validator.js';

const minimalInvalidSpecJson = JSON.stringify({ openapi: '3.0.0' });

describe('Performance options', () => {
  it('noLocation: skips computing ranges and returns non-located issues', () => {
    const result = validateOpenAPIDocument(minimalInvalidSpecJson, {
      noLocation: true,
    });

    expect(result.valid).toBe(false);
    const issues = result.errors?.issues ?? [];
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues as any[]) {
      expect(issue.range).toBeUndefined();
    }
  });

  it('autoFastThresholdBytes: triggers fast mode and returns non-located issues', () => {
    // Force auto-fast by setting an extremely small threshold
    const result = validateOpenAPIDocument(minimalInvalidSpecJson, {
      autoFastThresholdBytes: 1,
    });

    expect(result.valid).toBe(false);
    const issues = result.errors?.issues ?? [];
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues as any[]) {
      expect(issue.range).toBeUndefined();
    }
  });

  it('maxErrors: caps the number of returned issues', () => {
    const maxErrors = 3;
    const result = validateOpenAPIDocument(minimalInvalidSpecJson, {
      maxErrors,
    });
    expect(result.valid).toBe(false);
    const issues = result.errors?.issues ?? [];
    expect(issues.length).toBeLessThanOrEqual(maxErrors);
  });

  it('synthetic large spec smoke: fast vs strict runs', () => {
    // Generate a medium-sized synthetic spec to keep CI runtime reasonable
    const num = 1500;
    const components: Record<string, unknown> = {};
    for (let i = 0; i < num; i++) {
      components[`S${i}`] = { type: 'object', properties: { id: { type: 'integer' } } };
    }
    const paths: Record<string, unknown> = {};
    for (let i = 0; i < num; i++) {
      paths[`/r/${i}`] = {
        get: {
          responses: {
            '200': {
              description: 'ok',
              content: { 'application/json': { schema: { $ref: `#/components/schemas/S${i}` } } },
            },
          },
        },
      };
    }
    const content = JSON.stringify({ openapi: '3.0.3', info: { title: 'X', version: '1' }, components: { schemas: components }, paths });

    const fast = validateOpenAPIDocument(content, { fastMode: true, noLocation: true, maxErrors: 5 });
    const strict = validateOpenAPIDocument(content, { fastMode: false, noLocation: false, maxErrors: 5 });

    expect(fast).toBeDefined();
    expect(strict).toBeDefined();
  });
});
