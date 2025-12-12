import { describe, test, expect } from 'vitest';
import { getIssueSeverity, Severity } from '../severity.js';
import { z } from 'zod';

describe('getIssueSeverity', () => {
  test('returns warning for missing description fields', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.invalid_type,
      expected: 'string',
      received: 'undefined',
      path: ['info', 'description'],
      message: 'Required',
    };

    expect(getIssueSeverity(issue)).toBe('warning');
  });

  test('returns warning for missing summary fields', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.invalid_type,
      expected: 'string',
      received: 'undefined',
      path: ['paths', '/users', 'get', 'summary'],
      message: 'Required',
    };

    expect(getIssueSeverity(issue)).toBe('warning');
  });

  test('returns error for missing required fields like title', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.invalid_type,
      expected: 'string',
      received: 'undefined',
      path: ['info', 'title'],
      message: 'Required',
    };

    expect(getIssueSeverity(issue)).toBe('error');
  });

  test('returns error for custom validation issues', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['paths', '/users', 'get', 'responses'],
      message: 'At least one response must be defined',
    };

    expect(getIssueSeverity(issue)).toBe('error');
  });

  test('returns error for invalid_type on non-description/summary fields', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.invalid_type,
      expected: 'object',
      received: 'string',
      path: ['paths', '/users', 'get', 'responses', '200'],
      message: 'Expected object, received string',
    };

    expect(getIssueSeverity(issue)).toBe('error');
  });

  test('returns error for too_small issues', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: 'string',
      inclusive: true,
      path: ['info', 'version'],
      message: 'String must contain at least 1 character(s)',
    };

    expect(getIssueSeverity(issue)).toBe('error');
  });

  test('correctly identifies nested description paths as warnings', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.invalid_type,
      expected: 'string',
      received: 'undefined',
      path: ['components', 'schemas', 'User', 'description'],
      message: 'Required',
    };

    expect(getIssueSeverity(issue)).toBe('warning');
  });
});

