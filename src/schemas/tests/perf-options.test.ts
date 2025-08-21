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
});
