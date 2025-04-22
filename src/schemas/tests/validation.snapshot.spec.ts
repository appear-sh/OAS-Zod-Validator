import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateOpenAPI, ValidationResult } from '../validator.js';

// Helper to get the current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the directory containing the test specification files
const specsDir = path.resolve(__dirname, 'test-specs');

// Get all .json files from the specs directory
let specFilenames: string[];
try {
  specFilenames = fs
    .readdirSync(specsDir)
    .filter((file) => path.extname(file).toLowerCase() === '.json');
} catch (error) {
  console.error(`Error reading spec directory ${specsDir}:`, error);
  specFilenames = []; // Prevent tests from running if directory reading fails
}

describe('OpenAPI Specification Validation Snapshots', () => {
  // Check if specs were loaded, otherwise skip tests
  if (specFilenames.length === 0) {
    it.skip('Skipping snapshot tests as no spec files were found or readable in test-specs/', () => {});
    return;
  }

  it.each(specFilenames)(
    'should produce a consistent validation result for %s',
    (specFilename) => {
      const specPath = path.join(specsDir, specFilename);
      let specContent: string;
      let specDocument: unknown;
      let validationResult: ValidationResult | undefined;

      try {
        specContent = fs.readFileSync(specPath, 'utf-8');
      } catch (readError) {
        throw new Error(`Failed to read spec file ${specPath}: ${readError}`);
      }

      try {
        specDocument = JSON.parse(specContent);
      } catch (parseError) {
        // Snapshot the parsing error itself if the JSON is invalid
        expect({
          error: `Failed to parse JSON in ${specFilename}`,
          details:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
        }).toMatchSnapshot(`Parsing Error - ${specFilename}`);
        return; // Stop test execution for this file
      }

      try {
        // Run the validation
        // Consider adding specific options if needed, e.g., { strict: true }
        validationResult = validateOpenAPI(specDocument, { strict: false }); // Defaulting strict to false, adjust if needed

        // Snapshot the entire validation result object
        expect(validationResult).toMatchSnapshot();
      } catch (validationError) {
        // If validateOpenAPI itself throws an unexpected error (not a ZodError)
        expect({
          error: `Validation threw an unexpected error for ${specFilename}`,
          details:
            validationError instanceof Error
              ? validationError.message
              : String(validationError),
          stack:
            validationError instanceof Error
              ? validationError.stack
              : undefined,
        }).toMatchSnapshot(`Validation Runtime Error - ${specFilename}`);
      }
    }
  );
});
