import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { validateOpenAPI } from '../validator.js';
import { describe, test, expect, beforeAll } from '@jest/globals';

describe('Integration tests for multiple OAS specs', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const specsDir = path.join(__dirname, 'test-specs');
  
  // Add a static test that will always run
  test('validates basic OpenAPI spec', () => {
    const basicSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Basic API',
        version: '1.0.0'
      },
      paths: {}
    };
    
    const result = validateOpenAPI(basicSpec);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  // Dynamic tests from files
  describe('File-based tests', () => {
    beforeAll(() => {
      // Create test directory if it doesn't exist
      if (!fs.existsSync(specsDir)) {
        fs.mkdirSync(specsDir, { recursive: true });
      }

      // Write test files if they don't exist
      const testSpecs = {
        'valid-basic.yaml': `
          openapi: 3.0.0
          info:
            title: Basic Valid API
            version: 1.0.0
          paths: {}
        `,
        'invalid-basic.yaml': `
          openapi: invalid
          info:
            title: Invalid API
            version: 1.0.0
          paths: {}
        `,
        'valid-3.1.yaml': `
          openapi: 3.1.0
          info:
            title: Future Valid API
            version: 1.0.0
          paths: {}
        `
      };

      Object.entries(testSpecs).forEach(([filename, content]) => {
        const filePath = path.join(specsDir, filename);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, content);
        }
      });
    });

    test('validates all test specs', () => {
      const testFiles = fs.readdirSync(specsDir).filter(file => {
        return file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml');
      });

      testFiles.forEach(file => {
        const fullPath = path.join(specsDir, file);
        const fileData = fs.readFileSync(fullPath, 'utf-8');
        let doc: Record<string, unknown>;
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          doc = yaml.load(fileData) as Record<string, unknown>;
        } else {
          doc = JSON.parse(fileData) as Record<string, unknown>;
        }
        
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
});
