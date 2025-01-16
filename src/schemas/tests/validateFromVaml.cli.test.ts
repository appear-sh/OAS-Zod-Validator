import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync, ExecSyncOptions } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('validateFromYaml CLI', () => {
  const testDir = path.join(__dirname, 'test-specs');
  const execOptions: ExecSyncOptions = { 
    stdio: 'pipe',
    encoding: 'utf-8'
  };
  
  beforeAll(() => {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  test('handles missing filename argument', () => {
    const scriptPath = path.join(__dirname, '../../utils/validateFromYaml.ts');
    expect(() => {
      execSync(`npx ts-node ${scriptPath}`, execOptions);
    }).toThrow();
  });

  test('validates valid YAML file', () => {
    const validYaml = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      paths: {}
    `;
    const validFile = path.join(testDir, 'valid.yaml');
    fs.writeFileSync(validFile, validYaml);

    const scriptPath = path.join(__dirname, '../../utils/validateFromYaml.ts');
    const output = execSync(`npx ts-node ${scriptPath} ${validFile}`, execOptions);
    expect(output).toContain('YAML spec is valid OAS');
  });

  test('handles invalid YAML file', () => {
    const invalidYaml = `
      openapi: invalid
      info:
        title: Test API
        version: 1.0.0
      paths: {}
    `;
    const invalidFile = path.join(testDir, 'invalid.yaml');
    fs.writeFileSync(invalidFile, invalidYaml);

    const scriptPath = path.join(__dirname, '../../utils/validateFromYaml.ts');
    expect(() => {
      execSync(`npx ts-node ${scriptPath} ${invalidFile}`, execOptions);
    }).toThrow();
  });

  test('handles non-existent file', () => {
    const scriptPath = path.join(__dirname, '../../utils/validateFromYaml.ts');
    expect(() => {
      execSync(`npx ts-node ${scriptPath} non-existent.yaml`, execOptions);
    }).toThrow();
  });
});