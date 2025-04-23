import { describe, it, expect } from 'vitest';
import * as jsonc from 'jsonc-parser';
import { getLocationFromJsonAst } from './locationUtils.js';
import { validateOpenAPI } from '../schemas/validator.js';
import * as YAML from 'yaml';
import { getLocationFromYamlAst } from './locationUtils.js';
import { ZodIssue } from 'zod';

// Helper function to find nested Zod issues
function findNestedIssue(
  issues: ZodIssue[] | undefined,
  targetPath: string,
  targetCode: string
): ZodIssue | undefined {
  if (!issues) return undefined;
  for (const issue of issues) {
    if (issue.path.join('.') === targetPath && issue.code === targetCode) {
      return issue;
    }
    // Check if the issue has unionErrors and recurse
    if ('unionErrors' in issue && issue.unionErrors) {
      for (const error of (issue as any).unionErrors) {
        // Use 'any' assertion carefully if types are complex
        const found = findNestedIssue(error.issues, targetPath, targetCode);
        if (found) return found;
      }
    }
  }
  return undefined;
}

// --- Test Case 1: Invalid Type ---
const invalidTypeJson = `{
  "openapi": "3.0.0",
  "info": {
    "title": "Test",
    "version": 123
  },
  "paths": {}
}`;

describe('getLocationFromJsonAst', () => {
  it('should return correct range for invalid type error', () => {
    const parseErrors: jsonc.ParseError[] = [];
    const rootNode = jsonc.parseTree(invalidTypeJson, parseErrors);
    const parsedContent = jsonc.parse(invalidTypeJson);
    expect(parseErrors.length).toBe(0);

    const validationResult = validateOpenAPI(parsedContent);
    expect(validationResult.valid).toBe(false);

    const versionIssue = validationResult.errors?.issues.find(
      (issue) =>
        issue.path.join('.') === 'info.version' && issue.code === 'invalid_type'
    );
    expect(versionIssue).toBeDefined();

    const location = getLocationFromJsonAst(
      invalidTypeJson,
      rootNode,
      versionIssue!.path
    );

    expect(location).toBeDefined();
    expect(location?.start.line).toBe(5);
    expect(location?.start.column).toBe(16);
    expect(location?.end.line).toBe(5);
    expect(location?.end.column).toBe(19);
  });

  // --- Test Case 2: Invalid Enum ---
  const invalidEnumJson = `{
    "openapi": "3.1.0",
    "info": { "title": "Test", "version": "1.0" },
    "paths": {
      "/test": { "get": { "deprecated": "yes" } }
    }
  }`;

  it('should return correct range for invalid enum error', () => {
    const parseErrors: jsonc.ParseError[] = [];
    const rootNode = jsonc.parseTree(invalidEnumJson, parseErrors);
    const parsedContent = jsonc.parse(invalidEnumJson);
    expect(parseErrors.length).toBe(0);

    const validationResult = validateOpenAPI(parsedContent);
    expect(validationResult.valid).toBe(false);

    const deprecatedIssue = validationResult.errors?.issues.find(
      (issue) =>
        issue.path.join('.') === 'paths./test.get.deprecated' &&
        issue.code === 'invalid_type'
    );
    expect(deprecatedIssue).toBeDefined();

    const location = getLocationFromJsonAst(
      invalidEnumJson,
      rootNode,
      deprecatedIssue!.path
    );

    expect(location).toBeDefined();
    expect(location?.start.line).toBe(5);
    expect(location?.start.column).toBe(41);
    expect(location?.end.line).toBe(5);
    expect(location?.end.column).toBe(46);
  });

  // --- Test Case 3: Missing Required Field ---
  const missingRequiredJson = `{
    "openapi": "3.0.0",
    "info": {
      "description": "Missing fields"
    },
    "paths": {}
  }`;

  it('should return correct range for missing required field error', () => {
    const parseErrors: jsonc.ParseError[] = [];
    const rootNode = jsonc.parseTree(missingRequiredJson, parseErrors);
    const parsedContent = jsonc.parse(missingRequiredJson);
    expect(parseErrors.length).toBe(0);

    const validationResult = validateOpenAPI(parsedContent);
    expect(validationResult.valid).toBe(false);

    const infoIssue = validationResult.errors?.issues.find(
      (issue) =>
        issue.path.join('.') === 'info.title' && issue.code === 'invalid_type'
    );
    expect(infoIssue).toBeDefined();

    const location = getLocationFromJsonAst(missingRequiredJson, rootNode, [
      'info',
    ]);

    expect(location).toBeDefined();
    expect(location?.start.line).toBe(3);
    expect(location?.start.column).toBe(13);
    expect(location?.end.line).toBe(5);
    expect(location?.end.column).toBe(6);
  });

  // --- Test Case 4: Error within Array ---
  const invalidItemInArrayJson = `{
    "openapi": "3.0.0",
    "info": { "title": "Test", "version": "1.0" },
    "tags": [
      { "name": "tag1", "description": "desc1" },
      { "name": 123, "description": "tag has number name" }
    ],
    "paths": {}
  }`;

  it('should return correct range for invalid item in array error', () => {
    const parseErrors: jsonc.ParseError[] = [];
    const rootNode = jsonc.parseTree(invalidItemInArrayJson, parseErrors);
    const parsedContent = jsonc.parse(invalidItemInArrayJson);
    expect(parseErrors.length).toBe(0);

    const validationResult = validateOpenAPI(parsedContent);
    expect(validationResult.valid).toBe(false);

    const arrayItemIssue = validationResult.errors?.issues.find(
      (issue) =>
        issue.path.join('.') === 'tags.1.name' && issue.code === 'invalid_type'
    );
    expect(arrayItemIssue).toBeDefined();

    const location = getLocationFromJsonAst(
      invalidItemInArrayJson,
      rootNode,
      arrayItemIssue!.path
    );

    expect(location).toBeDefined();
    expect(location?.start.line).toBe(6);
    expect(location?.start.column).toBe(17);
    expect(location?.end.line).toBe(6);
    expect(location?.end.column).toBe(20);
  });

  // --- Test Case 5: Error in Nested Object ---
  const invalidNestedJson = `{
    "openapi": "3.0.0",
    "info": { "title": "Test", "version": "1.0" },
    "components": {
      "schemas": {
        "User": {
          "type": "object",
          "properties": {
            "profile": {
              "type": "object",
              "properties": {
                "email": {
                  "type": "string",
                  "format": "email"
                },
                "settings": {
                  "type": "object",
                  "properties": {
                    "darkMode": { "type": "wrongtype" } // <-- Error deep inside
                  }
                }
              }
            }
          }
        }
      }
    }
  }`;

  it('should return correct range for deeply nested error', () => {
    const parseErrors: jsonc.ParseError[] = [];
    const rootNode = jsonc.parseTree(invalidNestedJson, parseErrors);
    const parsedContent = jsonc.parse(invalidNestedJson);
    expect(parseErrors.length).toBe(0);

    const validationResult = validateOpenAPI(parsedContent);
    expect(validationResult.valid).toBe(false);

    // Use the recursive helper function
    const nestedIssue = findNestedIssue(
      validationResult.errors?.issues,
      'components.schemas.User.properties.profile.properties.settings.properties.darkMode.type',
      'invalid_enum_value' // Restore code check
    );
    expect(nestedIssue).toBeDefined(); // This should now pass

    const location = getLocationFromJsonAst(
      invalidNestedJson,
      rootNode,
      nestedIssue!.path // Use the path from the found issue
    );

    expect(location).toBeDefined();
    // Assertions based on actual logged offset 535, length 11
    expect(location?.start.line).toBe(19);
    expect(location?.start.column).toBe(43);
    expect(location?.end.line).toBe(19);
    expect(location?.end.column).toBe(54);
  });

  // TODO: Add more test cases (nesting, etc.)
});

// --- YAML Tests ---

describe('getLocationFromYamlAst', () => {
  // --- Test Case 1: Invalid Type ---
  const invalidTypeYaml = `
openapi: 3.0.0
info:
  title: Test YAML
  version: 123 # Invalid type
paths: {}
`;

  it('should return correct range for invalid type error in YAML', () => {
    const doc = YAML.parseDocument(invalidTypeYaml);
    expect(doc.errors.length).toBe(0);
    const parsedContent = doc.toJS();

    const validationResult = validateOpenAPI(parsedContent);
    expect(validationResult.valid).toBe(false);

    const versionIssue = validationResult.errors?.issues.find(
      (issue) =>
        issue.path.join('.') === 'info.version' && issue.code === 'invalid_type'
    );
    expect(versionIssue).toBeDefined();

    const location = getLocationFromYamlAst(
      invalidTypeYaml,
      doc,
      versionIssue!.path
    );

    expect(location).toBeDefined();
    expect(location?.start.line).toBe(5);
    expect(location?.start.column).toBe(12);
    expect(location?.end.line).toBe(5);
    expect(location?.end.column).toBe(15);
  });

  // TODO: Add more YAML test cases (enum, required, arrays, nesting, aliases)
});
