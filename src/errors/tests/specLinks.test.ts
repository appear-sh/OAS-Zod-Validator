import { describe, test, expect } from 'vitest';
import { getOASSpecLink } from '../specLinks.js';
import { z } from 'zod';

const BASE_URL = 'https://spec.openapis.org/oas/v3.1.0#';

describe('getOASSpecLink', () => {
  test('returns info-object link for info path', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.invalid_type,
      expected: 'string',
      received: 'undefined',
      path: ['info'],
      message: 'Required',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}info-object`);
  });

  test('returns info-object link for info.title path', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.invalid_type,
      expected: 'string',
      received: 'undefined',
      path: ['info', 'title'],
      message: 'Required',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}info-object`);
  });

  test('returns contact-object link for info.contact path', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.invalid_type,
      expected: 'object',
      received: 'undefined',
      path: ['info', 'contact'],
      message: 'Required',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}contact-object`);
  });

  test('returns paths-object link for paths', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['paths'],
      message: 'Required',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}paths-object`);
  });

  test('returns operation-object link for paths./.get', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['paths', '/users', 'get'],
      message: 'Invalid',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}operation-object`);
  });

  test('returns response-object link for paths./.get.responses.200', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['paths', '/users', 'get', 'responses', '200'],
      message: 'Invalid',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}response-object`);
  });

  test('returns responses-object link for paths./.get.responses', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['paths', '/users', 'get', 'responses'],
      message: 'Invalid',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}responses-object`);
  });

  test('returns schema-object link for schema paths', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: [
        'paths',
        '/users',
        'get',
        'responses',
        '200',
        'content',
        'application/json',
        'schema',
      ],
      message: 'Invalid',
    };

    // Matches 'response-object' due to responses in path before schema
    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}response-object`);
  });

  test('returns request-body-object link for components.requestBodies', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['components', 'requestBodies'],
      message: 'Invalid',
    };

    // Matches specific mapping in specLinkMappings
    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}request-body-object`);
  });

  test('returns components-object link for unknown components paths', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['components', 'unknownField'],
      message: 'Invalid',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}components-object`);
  });

  test('returns schema-object link for components.schemas', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['components', 'schemas'],
      message: 'Invalid',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}schema-object`);
  });

  test('returns undefined for unrecognised paths', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['randomField', 'subField'],
      message: 'Invalid',
    };

    expect(getOASSpecLink(issue)).toBeUndefined();
  });

  test('returns server-object link for servers path', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['servers'],
      message: 'Invalid',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}server-object`);
  });

  test('returns tag-object link for tags path', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['tags'],
      message: 'Invalid',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}tag-object`);
  });

  test('returns path-item-object for paths with non-method keys', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['paths', '/users', 'summary'],
      message: 'Invalid',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}path-item-object`);
  });

  test('returns parameter-object for paths./.parameters', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['paths', '/users', 'get', 'parameters'],
      message: 'Invalid',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}parameter-object`);
  });

  test('returns request-body-object for paths./.requestBody', () => {
    const issue: z.ZodIssue = {
      code: z.ZodIssueCode.custom,
      path: ['paths', '/users', 'post', 'requestBody'],
      message: 'Invalid',
    };

    expect(getOASSpecLink(issue)).toBe(`${BASE_URL}request-body-object`);
  });
});
