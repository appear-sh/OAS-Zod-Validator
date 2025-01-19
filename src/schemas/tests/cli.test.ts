const mockReadFileSync = jest.fn();
const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockRmSync = jest.fn();

jest.mock('fs', () => ({
  default: {
    readFileSync: mockReadFileSync,
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    rmSync: mockRmSync
  },
  readFileSync: mockReadFileSync,
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  rmSync: mockRmSync
}));
jest.mock('../../utils/validateFromYaml');

import { runCLI } from '../cli'; 
import { describe, test, expect, jest, beforeEach, beforeAll, afterAll, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { execSync, ExecSyncOptions } from 'child_process';
import { validateFromYaml } from '../../utils/validateFromYaml';
import { z } from 'zod';
import chalk from 'chalk';

describe('CLI Unit Tests', () => {
  const mockValidateFromYaml = jest.mocked(validateFromYaml);
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('shows usage when no filename provided', () => {
    runCLI([]);
    expect(mockConsoleLog).toHaveBeenNthCalledWith(1, chalk.blue('\nOAS-Zod-Validator CLI'));
    expect(mockConsoleLog).toHaveBeenNthCalledWith(2, chalk.dim('\nUsage:'));
    expect(mockConsoleLog).toHaveBeenNthCalledWith(3, '  ts-node cli.ts <path-to-yaml> [options]\n');
    expect(mockConsoleLog).toHaveBeenNthCalledWith(4, chalk.dim('Options:'));
    expect(mockConsoleLog).toHaveBeenNthCalledWith(5, '  --strict                Enable strict validation');
    expect(mockConsoleLog).toHaveBeenNthCalledWith(6, '  --allow-future          Allow future OAS versions');
    expect(mockConsoleLog).toHaveBeenNthCalledWith(7, '  --require-rate-limits   Require rate limit headers');
    expect(mockConsoleLog).toHaveBeenNthCalledWith(8, '  --help                  Show this help message\n');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('handles file read errors', () => {
    mockReadFileSync.mockImplementationOnce(() => {
      throw new Error('File not found');
    });

    runCLI(['nonexistent.yaml']);
    expect(mockConsoleError).toHaveBeenCalledWith(
      chalk.red('\nError reading or validating YAML file:'),
      expect.any(Error)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('handles validation success', () => {
    mockReadFileSync.mockReturnValue('valid yaml');
    mockValidateFromYaml.mockReturnValue({ 
      valid: true, 
      resolvedRefs: [] 
    });

    runCLI(['valid.yaml']);
    expect(mockConsoleLog).toHaveBeenCalledWith(chalk.green('\n✅ YAML spec is valid OAS'));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test('handles validation failure', () => {
    mockReadFileSync.mockReturnValue('invalid yaml');
    const zodError = new z.ZodError([{
      code: z.ZodIssueCode.invalid_type,
      expected: 'string',
      received: 'number',
      path: ['info', 'title'],
      message: 'Expected string, received number'
    }]);

    mockValidateFromYaml.mockReturnValue({ 
      valid: false, 
      errors: zodError,
      resolvedRefs: []
    });

    runCLI(['invalid.yaml']);
    expect(mockConsoleError).toHaveBeenCalledWith(chalk.red('\n❌ YAML spec is invalid:'));
    expect(mockConsoleError).toHaveBeenCalledWith(chalk.yellow('\nPath: info.title'));
    expect(mockConsoleError).toHaveBeenCalledWith(chalk.red('Error: Expected string, received number'));
    expect(mockConsoleError).toHaveBeenCalledWith(chalk.dim('Expected: string'));
    expect(mockConsoleError).toHaveBeenCalledWith(chalk.dim('Received: number'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

describe('CLI Integration Tests', () => {
  const testDir = path.resolve(__dirname, 'test-specs');
  const execOptions: ExecSyncOptions = { 
    stdio: 'pipe',
    encoding: 'utf-8',
    cwd: path.resolve(__dirname, '../..')
  };
  
  const cliPath = path.resolve(__dirname, '../cli.ts');
  
  // Store real fs module
  let realFs: typeof fs;
  
  beforeAll(() => {
    // Ensure no mocks are active
    jest.unmock('fs');
    jest.unmock('../../utils/validateFromYaml');
    
    // Re-import real fs
    realFs = jest.requireActual('fs');
    
    if (realFs.existsSync(testDir)) {
      realFs.rmSync(testDir, { recursive: true });
    }
    realFs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    if (realFs.existsSync(testDir)) {
      realFs.rmSync(testDir, { recursive: true });
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
    const validFile = path.resolve(testDir, 'valid.yaml');
    realFs.writeFileSync(validFile, validYaml, 'utf8');
    
    const command = `node -r ts-node/register "${cliPath}" "${validFile}" --strict`;
    const outputStrict = execSync(command, execOptions);
    expect(outputStrict.toString()).toContain('YAML spec is valid OAS');
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
    const invalidFile = path.resolve(testDir, 'invalid-syntax.yaml');
    realFs.writeFileSync(invalidFile, invalidYaml, 'utf8');

    const command = `node -r ts-node/register "${cliPath}" "${invalidFile}"`;
    expect(() => {
      execSync(command, execOptions);
    }).toThrow(/YAML spec is invalid/);
  });
});