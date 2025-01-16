import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { validateOpenAPI } from '../validator';
import { describe, test, expect } from '@jest/globals';

describe('Integration tests for multiple OAS specs', () => {
  const specsDir = path.join(__dirname, 'test-specs'); // e.g., "oas-zod-validator/src/schemas/tests/test-specs"
  
  const testFiles = fs.readdirSync(specsDir).filter(file => {
    // For example, only consider .json/.yaml
    return file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml');
  });

  testFiles.forEach(file => {
    test(`validates or fails appropriately for ${file}`, () => {
      const fullPath = path.join(specsDir, file);
      const fileData = fs.readFileSync(fullPath, 'utf-8');
      let doc: Record<string, unknown>;
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        doc = yaml.load(fileData) as Record<string, unknown>;
      } else {
        doc = JSON.parse(fileData) as Record<string, unknown>;
      }
      
      // Decide if this test expects a valid or invalid outcome
      // For instance, you could name your specs "valid-..." or "invalid-..."
      const isExpectedValid = file.startsWith('valid-') || file.startsWith('valid.');
      const options = {
        allowFutureOASVersions: file.includes('3.1') || file.includes('3.2'),
        strict: true,
      };
      
      const result = validateOpenAPI(doc, options);
      
      if (isExpectedValid) {
        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      } else {
        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
      }
    });
  });
});
