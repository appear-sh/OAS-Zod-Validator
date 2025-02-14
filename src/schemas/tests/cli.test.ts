/// <reference types="node" />
/// <reference types="jest" />

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { constants as fsConstants } from 'node:fs';
import * as fs from 'node:fs';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { z } from 'zod';
import { runCLI } from '../cli.js';
import * as validateFromYamlModule from '../../utils/validateFromYaml.js';
import chalk from 'chalk';

// Mock validateFromYaml
const mockValidateFromYaml = jest.fn().mockReturnValue({
  valid: true,
  resolvedRefs: [],
  errors: undefined
});

jest.mock('../../utils/validateFromYaml.js', () => ({
  validateFromYaml: mockValidateFromYaml
}));

const currentDirPath = path.dirname(fileURLToPath(import.meta.url));

// Mock console methods
const consoleMock = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
};

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
  throw new Error(`process.exit called with "${code}"`);
});

describe('CLI Unit Tests', () => {
  const testSpecsDir = path.join(currentDirPath, 'test-specs');
  const validFile = path.join(testSpecsDir, 'valid.yaml');
  const invalidFile = path.join(testSpecsDir, 'invalid.yaml');

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

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.resetModules();

    // Create test directory and files
    if (!fs.existsSync(testSpecsDir)) {
      fs.mkdirSync(testSpecsDir, { recursive: true });
    }
    fs.writeFileSync(validFile, validContent);
    fs.writeFileSync(invalidFile, invalidContent);

    // Reset mock to default behavior
    mockValidateFromYaml.mockReturnValue({
      valid: true,
      resolvedRefs: [],
      errors: undefined
    });
  });

  afterEach(() => {
    // Cleanup test files
    if (fs.existsSync(testSpecsDir)) {
      fs.rmSync(testSpecsDir, { recursive: true, force: true });
    }
  });

  describe('Help and Usage', () => {
    test('shows help when no file is provided', () => {
      expect(() => runCLI(['node', 'cli.js'])).toThrow('process.exit called with "1"');
      expect(consoleMock.log).toHaveBeenCalledWith('\nOAS-Zod-Validator CLI');
    });

    test('shows help with --help flag', () => {
      expect(() => runCLI(['node', 'cli.js', 'file.yaml', '--help'])).toThrow('process.exit called with "1"');
      expect(consoleMock.log).toHaveBeenCalledWith('\nOAS-Zod-Validator CLI');
    });
  });

  describe('File Reading', () => {
    test('handles non-existent file', () => {
      expect(() => runCLI(['node', 'cli.js', 'non-existent.yaml'])).toThrow('process.exit called with "1"');
      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(consoleMock.error).toHaveBeenCalledWith('Error reading file:', expect.any(Error));
    });

    test('reads valid file successfully', () => {
      mockValidateFromYaml.mockReturnValue({
        valid: true,
        resolvedRefs: [],
        errors: undefined
      });

      expect(() => runCLI(['node', 'cli.js', validFile])).toThrow('process.exit called with "0"');
      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(mockValidateFromYaml).toHaveBeenCalledWith(validContent, expect.any(Object));
    });
  });

  describe('Validation Options', () => {
    beforeEach(() => {
      mockValidateFromYaml.mockReturnValue({
        valid: true,
        resolvedRefs: [],
        errors: undefined
      });
    });

    test('passes strict option to validator', () => {
      expect(() => runCLI(['node', 'cli.js', validFile, '--strict'])).toThrow('process.exit called with "0"');
      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(mockValidateFromYaml).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ strict: true })
      );
    });

    test('passes allow-future option to validator', () => {
      expect(() => runCLI(['node', 'cli.js', validFile, '--allow-future'])).toThrow('process.exit called with "0"');
      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(mockValidateFromYaml).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ allowFutureOASVersions: true })
      );
    });

    test('passes require-rate-limits option to validator', () => {
      expect(() => runCLI(['node', 'cli.js', validFile, '--require-rate-limits'])).toThrow('process.exit called with "0"');
      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(mockValidateFromYaml).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ strictRules: { requireRateLimitHeaders: true } })
      );
    });
  });

  describe('Validation Results', () => {
    test('handles successful validation', () => {
      mockValidateFromYaml.mockReturnValue({
        valid: true,
        resolvedRefs: [],
        errors: undefined
      });

      expect(() => runCLI(['node', 'cli.js', validFile])).toThrow('process.exit called with "0"');
      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(consoleMock.log).toHaveBeenCalledWith('API Surface Analysis:');
    });

    test('handles validation failure', () => {
      mockValidateFromYaml.mockReturnValue({
        valid: false,
        resolvedRefs: [],
        errors: {
          issues: [{
            code: 'invalid_type',
            expected: 'string',
            received: 'number',
            path: ['info', 'title'],
            message: 'Expected string, received number'
          }]
        }
      });

      expect(() => runCLI(['node', 'cli.js', validFile])).toThrow('process.exit called with "1"');
      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(consoleMock.error).toHaveBeenCalledWith('❌ Validation failed:');
      expect(consoleMock.error).toHaveBeenCalledWith(chalk.yellow('Path: info.title'));
      expect(consoleMock.error).toHaveBeenCalledWith(chalk.red('Error: Expected string, received number'));
    });

    test('handles YAML parsing errors', () => {
      mockValidateFromYaml.mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      expect(() => runCLI(['node', 'cli.js', invalidFile])).toThrow('process.exit called with "1"');
      expect(consoleMock.log).toHaveBeenCalledWith('🔍 Validating OpenAPI Specification...');
      expect(consoleMock.error).toHaveBeenCalledWith('YAML Parsing Error:', 'Invalid YAML');
    });
  });
});