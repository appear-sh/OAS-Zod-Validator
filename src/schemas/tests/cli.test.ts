import { runCLI } from '../cli';
import { describe, test, expect, jest, beforeEach, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { execSync, ExecSyncOptions } from 'child_process';
import { validateFromYaml } from '../../utils/validateFromYaml';
import { z } from 'zod';

jest.mock('fs');
jest.mock('../../utils/validateFromYaml');

describe('CLI Unit Tests', () => {
  const mockValidateFromYaml = jest.mocked(validateFromYaml);
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows usage when no filename provided', () => {
    runCLI([]);
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('handles file read errors', () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File not found');
    });

    runCLI(['nonexistent.yaml']);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error reading or validating YAML file:',
      expect.any(Error)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('handles validation success', () => {
    (fs.readFileSync as jest.Mock).mockReturnValue('valid yaml');
    mockValidateFromYaml.mockReturnValue({ valid: true, resolvedRefs: [] });

    runCLI(['valid.yaml']);
    expect(mockConsoleLog).toHaveBeenCalledWith('YAML spec is valid OAS');
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test('handles validation failure', () => {
    (fs.readFileSync as jest.Mock).mockReturnValue('invalid yaml');
    mockValidateFromYaml.mockReturnValue({ 
      valid: false, 
      errors: new z.ZodError([{
        code: z.ZodIssueCode.custom,
        path: [],
        message: 'Validation failed'
      }]),
      resolvedRefs: []
    });

    runCLI(['invalid.yaml']);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'YAML spec is invalid:',
      expect.any(Error)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

describe('CLI Integration Tests', () => {
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

    const scriptPath = path.resolve(__dirname, './cli.ts');
    
    const outputStrict = execSync(
      `npx ts-node ${scriptPath} ${validFile} --strict`,
      execOptions
    ).toString();
    expect(outputStrict).toContain('YAML spec is valid OAS');
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

    const scriptPath = path.resolve(__dirname, './cli.ts');
    const result = execSync(
      `npx ts-node ${scriptPath} ${invalidFile}`,
      execOptions
    ).toString();
    expect(result).toContain('YAML spec is invalid');
  });
});