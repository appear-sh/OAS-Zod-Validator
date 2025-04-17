import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { validateOpenAPI } from '../validator.js';
import { describe, test, expect } from 'vitest';

describe('Integration tests for multiple OAS specs', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const specsDir = path.join(__dirname, 'test-specs');

  // Add a static test that will always run
  test('validates basic hardcoded OpenAPI spec', () => {
    const basicSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Basic API',
        version: '1.0.0',
      },
      paths: {},
    };

    const result = validateOpenAPI(basicSpec);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  // --- Dynamic tests from files ---
  let testFilesData: { filename: string; fullPath: string }[] = [];
  try {
    testFilesData = fs
      .readdirSync(specsDir)
      .filter(
        (file) =>
          file.endsWith('.json') ||
          file.endsWith('.yaml') ||
          file.endsWith('.yml')
      )
      .map((filename) => ({
        filename,
        fullPath: path.join(specsDir, filename),
      }));
  } catch (err) {
    console.error(`Error reading test specs directory: ${specsDir}`, err);
    // If we can't read the directory, add a failing test to make it obvious
    test('FAILED TO READ TEST SPECS DIRECTORY', () => {
      expect.fail(`Could not read test specs from ${specsDir}`);
    });
  }

  describe('File-based tests', () => {
    // Ensure the directory read was successful and files were found
    test('successfully loaded test spec files', () => {
      expect(testFilesData.length).toBeGreaterThan(0);
    });

    test.each(testFilesData)(
      'validates spec file: $filename',
      ({ filename, fullPath }) => {
        const fileData = fs.readFileSync(fullPath, 'utf-8');
        let doc: Record<string, unknown>;

        try {
          if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
            doc = yaml.load(fileData) as Record<string, unknown>;
          } else {
            doc = JSON.parse(fileData) as Record<string, unknown>;
          }
        } catch (parseError: unknown) {
          // Fail explicitly if parsing fails
          const message =
            parseError instanceof Error
              ? parseError.message
              : String(parseError);
          expect.fail(`Failed to parse ${filename}: ${message}`);
        }

        const hasPrefix =
          filename.startsWith('valid-') || filename.startsWith('invalid.');
        const isExpectedValid =
          filename.startsWith('valid-') || filename.startsWith('valid.');
        const options = {
          allowFutureOASVersions:
            filename.includes('3.1') || filename.includes('3.2'),
          strict: true,
        };

        // Add try-catch around validation itself for better error reporting
        let result;
        try {
          result = validateOpenAPI(doc, options);
        } catch (validationError: unknown) {
          const message =
            validationError instanceof Error
              ? validationError.message
              : String(validationError);
          expect.fail(
            `Validation threw an unexpected error for ${filename}: ${message}`
          );
        }

        // --- Assertions ---
        if (hasPrefix) {
          // For files with prefixes, assert the expected outcome strictly
          if (isExpectedValid) {
            expect(result.valid).toBe(true);
            expect(result.errors).toBeUndefined();
          } else {
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
          }
        } else {
          // For files without prefixes (real-world examples), log the outcome and assert successful execution

          // Calculate error count based on the ERRORS.ISSUES array
          const errorCount = result.errors?.issues?.length ?? 0;
          let summaryString = `\n--- Processing Real-World Spec: ${filename} --- Result: ${result.valid}`;
          if (!result.valid) {
            summaryString += ` --- (Reported errors: ${errorCount}) ---`;
          } else {
            summaryString += ' ---';
          }
          console.log(summaryString);

          // Only log full errors if VERBOSE_INTEGRATION is set
          if (
            result.errors &&
            (process.env.VERBOSE_INTEGRATION === '1' ||
              process.env.VERBOSE_INTEGRATION?.toLowerCase() === 'true')
          ) {
            console.log(`  Errors: ${JSON.stringify(result.errors, null, 2)}`);
          }
          // console.log(`--- End ${filename} ---`); // Removed redundant end marker

          // Basic assertion: Did the validator run and produce a boolean result?
          expect(result).toBeDefined();
          expect(typeof result.valid).toBe('boolean');

          // ADDED: Stricter check - if invalid, errors array must be populated
          if (!result.valid) {
            // Check the length of the issues array within the ZodError object
            expect(
              result.errors?.issues && result.errors.issues.length > 0
            ).toBe(true);
          }
        }
      }
    );
  });
});
