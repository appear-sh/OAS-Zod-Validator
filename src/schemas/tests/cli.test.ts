/// <reference types="node" />
/// <reference types="jest" />

import type { ExecSyncOptionsWithStringEncoding } from 'node:child_process';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import chalk from 'chalk';
import { z } from 'zod';
import { runCLI } from '../cli.js';
import { validateFromYaml } from '../../utils/validateFromYaml.js';
import type { ValidationOptions, ValidationResult } from '../validator.js';
import { spawnSync } from 'node:child_process';

const currentDirPath = path.dirname(fileURLToPath(import.meta.url));

// Test helpers
const createMockValidationResult = (valid: boolean, resolvedRefs: string[] = [], errors?: z.ZodError): ValidationResult => ({
  valid,
  resolvedRefs,
  errors
});

// Mock fs module
const mockReadFileSync = jest.fn().mockReturnValue('openapi: "3.0.0"\ninfo:\n  title: "Test API"\n  version: "1.0.0"\npaths: {}');
const mockExistsSync = jest.fn().mockReturnValue(true);
const mockWriteFileSync = jest.fn();

jest.mock('node:fs', () => ({
  readFileSync: mockReadFileSync,
  existsSync: mockExistsSync,
  writeFileSync: mockWriteFileSync,
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn()
  },
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1
  }
}));

// Mock validateFromYaml
const mockValidateFromYaml = jest.fn<typeof validateFromYaml>();
jest.mock('../../utils/validateFromYaml.js', () => ({
  validateFromYaml: mockValidateFromYaml,
  __esModule: true
}));

// Mock console methods
const consoleMock = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
};

// Mock process.exit
const processExitMock = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

describe('CLI Unit Tests', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset individual mocks
    consoleMock.log.mockClear();
    consoleMock.error.mockClear();
    processExitMock.mockClear();
    mockReadFileSync.mockClear();
    mockExistsSync.mockClear();
    mockWriteFileSync.mockClear();
    mockValidateFromYaml.mockClear();

    // Reset process.argv
    process.argv = ['node', 'cli.js'];

    // Setup mock defaults
    mockReadFileSync.mockReturnValue('openapi: "3.0.0"\ninfo:\n  title: "Test API"\n  version: "1.0.0"\npaths: {}');
    mockExistsSync.mockReturnValue(true);
    mockValidateFromYaml.mockReturnValue(createMockValidationResult(true));
  });

  describe('Command Line Arguments', () => {
    test('shows usage when no filename provided', () => {
      jest.isolateModules(() => {
        runCLI(['node', 'cli.js']);
        
        expect(consoleMock.log).toHaveBeenCalledWith('\nOAS-Zod-Validator CLI');
        expect(consoleMock.log).toHaveBeenCalledWith('\nUsage:');
        expect(consoleMock.log).toHaveBeenCalledWith('  oas-zod-validator <path-to-yaml> [options]\n');
        expect(processExitMock).toHaveBeenCalledWith(1);
      });
    });

    test('accepts validation options from command line', () => {
      const expectedOptions = {
        strict: true,
        allowFutureOASVersions: true,
        strictRules: {
          requireRateLimitHeaders: true
        }
      };

      jest.isolateModules(() => {
        runCLI(['node', 'cli.js', 'valid.yaml', '--strict', '--allow-future', '--require-rate-limits']);
        
        expect(mockReadFileSync).toHaveBeenCalledWith('valid.yaml', 'utf-8');
        expect(mockValidateFromYaml).toHaveBeenCalledWith(
          'openapi: "3.0.0"\ninfo:\n  title: "Test API"\n  version: "1.0.0"\npaths: {}',
          expect.objectContaining(expectedOptions)
        );
        expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
        expect(consoleMock.log).toHaveBeenCalledWith('API Surface Analysis:');
        expect(processExitMock).toHaveBeenCalledWith(0);
      });
    });

    test('handles default options when none provided', () => {
      const expectedOptions = {
        strict: false,
        allowFutureOASVersions: false,
        strictRules: {
          requireRateLimitHeaders: false
        }
      };

      jest.isolateModules(() => {
        runCLI(['node', 'cli.js', 'valid.yaml']);
        
        expect(mockValidateFromYaml).toHaveBeenCalledWith(
          'openapi: "3.0.0"\ninfo:\n  title: "Test API"\n  version: "1.0.0"\npaths: {}',
          expect.objectContaining(expectedOptions)
        );
        expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
        expect(consoleMock.log).toHaveBeenCalledWith('API Surface Analysis:');
        expect(processExitMock).toHaveBeenCalledWith(0);
      });
    });
  });

  describe('File Handling', () => {
    test('handles file read errors', () => {
      const error = new Error('ENOENT: no such file or directory, open \'nonexistent.yaml\'');
      mockReadFileSync.mockImplementation(() => {
        throw error;
      });

      jest.isolateModules(() => {
        runCLI(['node', 'cli.js', 'nonexistent.yaml']);
        
        expect(consoleMock.error).toHaveBeenCalledWith('Error reading file:', error);
        expect(processExitMock).toHaveBeenCalledWith(1);
      });
    });

    test('handles YAML parsing errors', () => {
      const error = new Error('YAML syntax error');
      mockValidateFromYaml.mockImplementation(() => {
        throw error;
      });

      jest.isolateModules(() => {
        runCLI(['node', 'cli.js', 'invalid.yaml']);
        
        expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
        expect(consoleMock.error).toHaveBeenCalledWith('YAML Parsing Error:', error.message);
        expect(processExitMock).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Validation Results', () => {
    test('handles validation success', () => {
      runCLI(['node', 'cli.js', 'valid.yaml']);
      
      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(consoleMock.log).toHaveBeenCalledWith('API Surface Analysis:');
      expect(processExitMock).toHaveBeenCalledWith(0);
    });

    test('handles validation success with resolved references', () => {
      mockValidateFromYaml.mockReturnValue(
        createMockValidationResult(true, ['#/components/schemas/User'])
      );

      runCLI(['node', 'cli.js', 'valid.yaml']);
      
      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(consoleMock.log).toHaveBeenCalledWith('API Surface Analysis:');
      expect(consoleMock.log).toHaveBeenCalledWith('Resolved references:');
      expect(consoleMock.log).toHaveBeenCalledWith('  #/components/schemas/User');
      expect(processExitMock).toHaveBeenCalledWith(0);
    });

    test('handles validation failure with Zod errors', () => {
      const zodError = {
        errors: [
          {
            path: ['info', 'title'],
            message: 'Expected string, received number'
          }
        ]
      } as z.ZodError;

      mockValidateFromYaml.mockReturnValue(createMockValidationResult(false, [], zodError));

      runCLI(['node', 'cli.js', 'invalid.yaml']);

      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(consoleMock.error).toHaveBeenCalledWith('❌ Validation failed:');
      expect(consoleMock.error).toHaveBeenCalledWith(expect.stringContaining('Path: info.title'));
      expect(consoleMock.error).toHaveBeenCalledWith(expect.stringContaining('Error: Expected string, received number'));
      expect(processExitMock).toHaveBeenCalledWith(1);
    });

    test('handles different types of Zod validation errors', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'object',
          received: 'string',
          path: ['paths'],
          message: 'Expected object, received string'
        },
        {
          code: 'invalid_enum_value',
          options: ['a', 'b'],
          received: 'c',
          path: ['enum'],
          message: 'Invalid enum value'
        },
        {
          code: 'unrecognized_keys',
          keys: ['invalid'],
          path: ['object'],
          message: 'Unrecognized key'
        }
      ]);

      mockValidateFromYaml.mockReturnValue(createMockValidationResult(false, [], zodError));

      runCLI(['node', 'cli.js', 'invalid.yaml']);
      
      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(consoleMock.error).toHaveBeenCalledWith('❌ Validation failed:');
      expect(consoleMock.error).toHaveBeenCalledWith(expect.stringContaining('Path: paths'));
      expect(consoleMock.error).toHaveBeenCalledWith(expect.stringContaining('Path: enum'));
      expect(consoleMock.error).toHaveBeenCalledWith(expect.stringContaining('Path: object'));
      expect(processExitMock).toHaveBeenCalledWith(1);
    });
  });

  describe('CLI Integration Tests', () => {
    const cliPath = path.resolve(currentDirPath, '../../../dist/schemas/cli.js');
    const validFile = path.resolve(currentDirPath, 'test-specs/valid.yaml');
    const invalidFile = path.resolve(currentDirPath, 'test-specs/invalid-syntax.yaml');
    
    const execOptions: ExecSyncOptionsWithStringEncoding = {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.resolve(currentDirPath, '../../..'),
      env: { ...process.env, FORCE_COLOR: '0' }  // Disable chalk coloring for consistent output
    };

    beforeEach(() => {
      // Create test directory if it doesn't exist
      const testSpecsDir = path.dirname(validFile);
      if (!fs.existsSync(testSpecsDir)) {
        fs.mkdirSync(testSpecsDir, { recursive: true });
      }

      // Write test files
      const validContent = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`;

      const invalidContent = `
openapi: 3.0.0
info:
  title: Invalid API
  version: 1.0.0
paths: {
  invalid yaml here
  this is not valid yaml
  missing closing brace
`;

      fs.writeFileSync(validFile, validContent);
      fs.writeFileSync(invalidFile, invalidContent);
    });

    test('validates valid YAML file with different options', () => {
      const command = `node "${cliPath}" "${validFile}" --strict`;
      const output = execSync(command, execOptions).toString();
      expect(output).toContain('🔍 Validating OpenAPI Specification...');
      expect(output).toContain('API Surface Analysis:');
    });

    test('handles invalid YAML syntax', () => {
      // Ensure CLI file exists
      expect(fs.existsSync(cliPath)).toBe(true);
      
      const result = spawnSync('node', [cliPath, invalidFile], {
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: path.resolve(currentDirPath, '../../..'),
        env: { ...process.env, FORCE_COLOR: '0' }
      });

      // Debug logging
      console.log('Debug - CLI path:', cliPath);
      console.log('Debug - Invalid file path:', invalidFile);
      console.log('Debug - stdout:', result.stdout);
      console.log('Debug - stderr:', result.stderr);
      console.log('Debug - error:', result.error);
      
      expect(result.status).toBe(1);
      const output = (result.stdout || '') + (result.stderr || '');
      expect(output).toContain('🔍 Validating OpenAPI Specification...');
      expect(output).toContain('❌ Validation failed:');
      expect(output).toContain('unexpected end of the stream within a flow collection');
    });

    afterEach(() => {
      // Clean up test files
      try {
        fs.unlinkSync(validFile);
        fs.unlinkSync(invalidFile);
      } catch (err) {
        // Ignore errors
      }
    });
  });
});