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
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  test('handles missing filename argument', () => {
    const scriptPath = path.join(__dirname, '../../utils/validateFromYaml.ts');
    expect(() => {
      execSync(`npx ts-node ${scriptPath}`, execOptions);
    }).toThrow(/Usage: ts-node validateFromYaml.ts/);
  });

  test('validates valid YAML file with different options', () => {
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
    
    // Test with strict mode
    const outputStrict = execSync(
      `npx ts-node ${scriptPath} ${validFile} --strict`,
      execOptions
    );
    expect(outputStrict).toContain('YAML spec is valid OAS');

    // Test future version with allow-future flag
    const futureYaml = `
      openapi: 3.2.0
      info:
        title: Test API
        version: 1.0.0
      paths: {}
    `;
    const futureFile = path.join(testDir, 'future.yaml');
    fs.writeFileSync(futureFile, futureYaml);

    const outputFuture = execSync(
      `npx ts-node ${scriptPath} ${futureFile} --allow-future`,
      execOptions
    );
    expect(outputFuture).toContain('YAML spec is valid OAS');
  });

  test('handles invalid YAML syntax', () => {
    const invalidYaml = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      paths:
        *invalid-anchor
    `;
    const invalidFile = path.join(testDir, 'invalid-syntax.yaml');
    fs.writeFileSync(invalidFile, invalidYaml);

    const scriptPath = path.join(__dirname, '../../utils/validateFromYaml.ts');
    expect(() => {
      execSync(`npx ts-node ${scriptPath} ${invalidFile}`, execOptions);
    }).toThrow(/YAML spec is invalid/);
  });

  test('handles invalid OpenAPI spec', () => {
    const invalidSpec = `
      openapi: invalid-version
      info:
        title: Test API
        version: 1.0.0
      paths: {}
    `;
    const invalidFile = path.join(testDir, 'invalid-spec.yaml');
    fs.writeFileSync(invalidFile, invalidSpec);

    const scriptPath = path.join(__dirname, '../../utils/validateFromYaml.ts');
    expect(() => {
      execSync(`npx ts-node ${scriptPath} ${invalidFile}`, execOptions);
    }).toThrow(/YAML spec is invalid/);
  });

  test('handles file system errors', () => {
    const scriptPath = path.join(__dirname, '../../utils/validateFromYaml.ts');
    const nonExistentFile = path.join(testDir, 'non-existent.yaml');

    expect(() => {
      execSync(`npx ts-node ${scriptPath} ${nonExistentFile}`, execOptions);
    }).toThrow(/Error reading or validating YAML file/);
  });

  test('handles invalid file permissions', () => {
    const validYaml = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      paths: {}
    `;
    const restrictedFile = path.join(testDir, 'restricted.yaml');
    fs.writeFileSync(restrictedFile, validYaml);
    fs.chmodSync(restrictedFile, 0o000);

    const scriptPath = path.join(__dirname, '../../utils/validateFromYaml.ts');
    expect(() => {
      execSync(`npx ts-node ${scriptPath} ${restrictedFile}`, execOptions);
    }).toThrow(/Error reading or validating YAML file/);

    // Cleanup: restore permissions to allow deletion
    fs.chmodSync(restrictedFile, 0o666);
  });
});