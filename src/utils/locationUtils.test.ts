import { describe, it, expect } from 'vitest';
import * as jsonc from 'jsonc-parser';
import { getLocationFromJsonAst } from './locationUtils.js';
import { validateOpenAPI } from '../schemas/validator.js';

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
    expect(location?.start.column).toBe(15);
    expect(location?.end.line).toBe(5);
    expect(location?.end.column).toBe(18);
    expect(location?.start.offset).toBe(65);
    expect(location?.end.offset).toBe(68);
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
        issue.code === 'invalid_enum_value'
    );
    expect(deprecatedIssue).toBeDefined();

    const location = getLocationFromJsonAst(
      invalidEnumJson,
      rootNode,
      deprecatedIssue!.path
    );

    expect(location).toBeDefined();
    expect(location?.start.line).toBe(5);
    expect(location?.start.column).toBe(34);
    expect(location?.end.line).toBe(5);
    expect(location?.end.column).toBe(39);
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
      (issue) => issue.path.join('.') === 'info'
    );
    expect(infoIssue).toBeDefined();

    const location = getLocationFromJsonAst(
      missingRequiredJson,
      rootNode,
      infoIssue!.path
    );

    expect(location).toBeDefined();
    expect(location?.start.line).toBe(3);
    expect(location?.start.column).toBe(10);
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
    expect(location?.start.column).toBe(16);
    expect(location?.end.line).toBe(6);
    expect(location?.end.column).toBe(19);
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

    const nestedIssue = validationResult.errors?.issues.find(
      (issue) =>
        issue.path.join('.') ===
          'components.schemas.User.properties.profile.properties.settings.properties.darkMode.type' &&
        issue.code === 'invalid_enum_value'
    );
    expect(nestedIssue).toBeDefined();

    const location = getLocationFromJsonAst(
      invalidNestedJson,
      rootNode,
      nestedIssue!.path
    );

    expect(location).toBeDefined();
    expect(location?.start.line).toBe(19);
    expect(location?.start.column).toBe(31);
    expect(location?.end.line).toBe(19);
    expect(location?.end.column).toBe(42);
  });

  // TODO: Add more test cases (nesting, etc.)
}); 