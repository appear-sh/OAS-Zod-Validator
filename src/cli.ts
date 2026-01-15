#!/usr/bin/env node
'use strict';

import { ValidationOptions, validateOpenAPI } from './schemas/validator.js';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import { fileURLToPath } from 'url';
import * as YAML from 'yaml';
import { getOASSpecLink } from './errors/specLinks.js';
import { getIssueSeverity, getWarningSuggestion } from './errors/severity.js';
import { enhanceZodIssue } from './errors/messages.js';
import * as jsonc from 'jsonc-parser';
import {
  getLocationFromJsonAst,
  getLocationFromYamlAst,
} from './utils/locationUtils.js';
import { Range } from './types/location.js';

// Get package version for CLI
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
);

/**
 * CLI configuration options interface
 */
export interface CLIOptions {
  strict?: boolean;
  allowFutureOASVersions?: boolean;
  requireRateLimitHeaders?: boolean;
  format?: 'json' | 'pretty';
  config?: string;
  interactive?: boolean;
  cacheEnabled?: boolean;
  cacheSize?: number;
  // Performance/behaviour knobs
  fast?: boolean;
  noLocation?: boolean;
  maxErrors?: number;
  autoFastThresholdBytes?: number;
  skipExamples?: boolean;
  skipPatternChecks?: boolean;
  quiet?: boolean;
}

/**
 * Configuration file interface
 */
export interface ConfigFile {
  strict?: boolean;
  allowFutureOASVersions?: boolean;
  requireRateLimitHeaders?: boolean;
  format?: 'json' | 'pretty';
  cache?: {
    enabled?: boolean;
    maxSize?: number;
  };
}

// ASCII art banner with modern gradient
const asciiArt = `
 ██████   █████  ███████     ███████  ██████  ██████      ██    ██  █████  ██      ██ ██████   █████  ████████  ██████  ██████  
██    ██ ██   ██ ██             ███  ██    ██ ██   ██     ██    ██ ██   ██ ██      ██ ██   ██ ██   ██    ██    ██    ██ ██   ██ 
██    ██ ███████ ███████       ███   ██    ██ ██   ██     ██    ██ ███████ ██      ██ ██   ██ ███████    ██    ██    ██ ██████  
██    ██ ██   ██      ██      ███    ██    ██ ██   ██      ██  ██  ██   ██ ██      ██ ██   ██ ██   ██    ██    ██    ██ ██   ██ 
 ██████  ██   ██ ███████     ███████  ██████  ██████        ████   ██   ██ ███████ ██ ██████  ██   ██    ██     ██████  ██   ██                                                                                                                                   
`;

const gradientColors = [
  '#35D1BA', // Fresh teal
  '#61C49E', // Mint
  '#96B37C', // Sage
  '#D39F56', // Warm gold
  '#EE9644', // Sunset orange
];

/**
 * Displays a welcoming CLI banner with gradient colors
 */
function displayWelcome(): void {
  const lines = asciiArt.split('\n');
  const coloredArt = lines
    .map((line, index) => {
      const color = gradientColors[Math.min(index, gradientColors.length - 1)];
      return chalk.hex(color)(line);
    })
    .join('\n');

  console.log(coloredArt);
  console.log(chalk.hex('#35D1BA')('\n📋 OpenAPI Specification Validator'));
  console.log(chalk.hex('#EE9644')('━'.repeat(40), '\n'));
}

/**
 * Loads and validates a configuration file
 * @param configPath - Path to the configuration file
 * @returns Parsed configuration options
 */
async function loadConfig(configPath: string): Promise<ConfigFile> {
  const spinner = ora({
    text: 'Loading configuration...',
    color: 'cyan',
  }).start();

  try {
    const config = JSON.parse(
      await fs.promises.readFile(configPath, 'utf8')
    ) as ConfigFile;

    // Validate cache configuration
    if (config.cache) {
      if (
        typeof config.cache.enabled !== 'undefined' &&
        typeof config.cache.enabled !== 'boolean'
      ) {
        throw new Error('Configuration error: cache.enabled must be a boolean');
      }

      if (typeof config.cache.maxSize !== 'undefined') {
        if (
          typeof config.cache.maxSize !== 'number' ||
          config.cache.maxSize < 1
        ) {
          throw new Error(
            'Configuration error: cache.maxSize must be a positive number'
          );
        }
      }
    }

    spinner.succeed('Configuration loaded successfully');
    return config;
  } catch (err) {
    spinner.fail('Failed to load configuration');
    if (err instanceof Error) {
      throw new Error(`Configuration error: ${err.message}`);
    }
    throw err;
  }
}

// --- Helper function to extract the most specific error from union errors ---
/**
 * Recursively digs into nested union errors to find the most specific issue.
 * Returns the deepest error with the longest path and most descriptive message.
 * Preserves the original issue path as context for relative paths.
 */
function extractMostSpecificError(issue: any): {
  path: (string | number)[];
  message: string;
} {
  const originalPath = issue.path || [];

  // If not a union error, return as-is
  if (issue.code !== 'invalid_union' || !Array.isArray(issue.errors)) {
    let msg = issue.message || 'Invalid input';
    // Improve generic messages
    if (msg === 'Invalid input' || msg === 'Invalid value') {
      if (issue.code === 'invalid_type') {
        msg = `Expected ${issue.expected}, received ${issue.received}`;
      } else if (issue.code === 'invalid_value' && issue.values) {
        msg = `Expected one of: ${issue.values.slice(0, 5).join(', ')}${issue.values.length > 5 ? '...' : ''}`;
      }
    }
    return { path: originalPath, message: msg };
  }

  // Collect all leaf errors from all branches
  const candidates: {
    path: (string | number)[];
    message: string;
    depth: number;
  }[] = [];

  function collectErrors(
    errors: any[],
    parentPath: (string | number)[],
    depth: number
  ) {
    for (const branch of errors) {
      if (!Array.isArray(branch)) continue;
      for (const err of branch) {
        // Zod paths are absolute from document root - use the longer (more specific) one
        const errRelPath = err.path || [];
        const fullPath =
          errRelPath.length > parentPath.length ? errRelPath : parentPath;

        if (err.code === 'invalid_union' && Array.isArray(err.errors)) {
          // Recurse into nested unions, carrying forward the path context
          collectErrors(
            err.errors,
            errRelPath.length > parentPath.length ? errRelPath : parentPath,
            depth + 1
          );
        } else {
          // Leaf error - collect it
          let msg = err.message || 'Invalid input';

          // Improve generic messages based on error code
          if (msg === 'Invalid input' || msg === 'Invalid value') {
            if (err.code === 'invalid_type') {
              msg = `Expected ${err.expected}, received ${err.received}`;
            } else if (err.code === 'invalid_value' && err.values) {
              const vals = err.values.slice(0, 5).join(', ');
              msg = `Expected one of: ${vals}${err.values.length > 5 ? '...' : ''}`;
            } else if (err.code === 'unrecognized_keys' && err.keys) {
              msg = `Unrecognised keys: ${err.keys.join(', ')}`;
            }
          }

          // Use the longer of fullPath or errRelPath
          const usePath =
            fullPath.length >= errRelPath.length ? fullPath : errRelPath;
          candidates.push({ path: usePath, message: msg, depth });
        }
      }
    }
  }

  collectErrors(issue.errors, originalPath, 0);

  // Prefer errors with longer paths (more specific) and non-generic messages
  if (candidates.length === 0) {
    return { path: originalPath, message: issue.message || 'Invalid input' };
  }

  // Sort by: non-generic message first, then longest path, then deepest
  candidates.sort((a, b) => {
    const aGeneric =
      a.message === 'Invalid input' || a.message === 'Invalid value';
    const bGeneric =
      b.message === 'Invalid input' || b.message === 'Invalid value';
    if (aGeneric !== bGeneric) return aGeneric ? 1 : -1;
    if (b.path.length !== a.path.length) return b.path.length - a.path.length;
    return b.depth - a.depth;
  });

  return candidates[0];
}

// --- Helper function to get value from path ---
/**
 * Safely retrieves a value from a nested object using a path array.
 * @param obj The object to traverse.
 * @param path An array of keys/indices representing the path.
 * @returns The value at the specified path, or undefined if not found.
 */
function getValueFromPath(obj: any, path: (string | number)[]): any {
  let current = obj;
  for (const key of path) {
    if (current === null || typeof current !== 'object') {
      return undefined; // Cannot traverse further
    }
    // Handle cases where path segments might represent keys with dots
    // This is a simple check; more robust handling might be needed if keys truly contain dots.
    if (typeof key === 'string' && key.includes('.') && !(key in current)) {
      // Attempt splitting if direct key access fails - might be overly simplistic
      const keys = key.split('.');
      let tempCurrent = current;
      for (const subKey of keys) {
        if (
          tempCurrent === null ||
          typeof tempCurrent !== 'object' ||
          !(subKey in tempCurrent)
        ) {
          current = undefined; // Path segment not found
          break;
        }
        tempCurrent = tempCurrent[subKey];
      }
      current = tempCurrent;
    } else if (!(key in current)) {
      current = undefined; // Path segment not found
    } else {
      current = current[key];
    }

    if (current === undefined) {
      return undefined; // Path does not exist fully
    }
  }
  return current;
}

// --- Helper function to format value for CLI ---
/**
 * Formats a value for readable CLI output, truncating large content.
 * @param value The value to format.
 * @returns A formatted string representation.
 */
function formatValueForCli(value: any): string {
  if (value === undefined) {
    return chalk.dim('[Not Found]');
  }
  if (typeof value === 'string') {
    if (value.length > 100) {
      // Add quotes for strings
      return chalk.dim(`"${value.substring(0, 97)}..."`);
    }
    return chalk.dim(`"${value}"`);
  }
  if (typeof value === 'object' && value !== null) {
    try {
      // Use yaml stringify for CLI display formatting
      const yamlString = YAML.stringify(value, {
        indent: 2,
        lineWidth: 80,
      });
      const lines = yamlString.split('\n');
      if (lines.length > 10 || yamlString.length > 300) {
        return chalk.dim('{ /* Large object/array */ }');
      }
      // Add string type annotation for parameter 'l'
      return chalk.dim(lines.map((l: string) => `  ${l}`).join('\n'));
    } catch {
      return chalk.dim('[Unserializable Value]');
    }
  }
  // Handle numbers, booleans, null
  return chalk.dim(String(value));
}

/**
 * Primary validation logic called by CLI
 * @param filePath - Path to the OpenAPI spec file
 * @param cliOptions - Processed CLI options
 */
async function validateSpec(
  filePath: string,
  cliOptions: CLIOptions
): Promise<void> {
  const spinner: {
    succeed: (msg?: string) => void;
    fail: (msg?: string) => void;
  } = cliOptions.quiet
    ? { succeed: () => {}, fail: () => {} }
    : (ora({
        text: `Validating ${chalk.blueBright(filePath)}...`,
        spinner: 'dots',
      }).start() as any);

  let parsedContent: unknown = null;
  let jsonAst: jsonc.Node | undefined = undefined;
  let yamlDoc: YAML.Document.Parsed | undefined = undefined;
  let fileContent = '';

  try {
    fileContent = await fs.promises.readFile(filePath, 'utf8');

    try {
      const isYaml = path.extname(filePath).toLowerCase().startsWith('.y');
      if (isYaml) {
        yamlDoc = YAML.parseDocument(fileContent);
        if (yamlDoc.errors.length > 0) {
          const firstError = yamlDoc.errors[0];
          // Access line number correctly using index 0
          const errorLine = firstError.linePos?.[0]?.line ?? 'unknown';
          throw new Error(
            `YAML parsing error: ${firstError.message} at line ${errorLine}`
          );
        }
        parsedContent = yamlDoc.toJS();
      } else {
        const parseErrors: jsonc.ParseError[] = [];
        jsonAst = jsonc.parseTree(fileContent, parseErrors);

        if (parseErrors.length > 0) {
          const firstError = parseErrors[0];
          throw new Error(
            `JSON parsing error at offset ${firstError.offset}, length ${firstError.length}: ${jsonc.printParseErrorCode(firstError.error)}`
          );
        }
        parsedContent = jsonc.parse(fileContent);
      }
    } catch (parseErr) {
      spinner.fail('Failed to parse input file');
      if (parseErr instanceof Error) {
        console.error(chalk.red('\n❌ Parse Error:'), parseErr.message);
      } else {
        console.error(chalk.red('\n❌ An unexpected parsing error occurred'));
      }
      process.exit(1);
    }

    const validationOptions: ValidationOptions = {
      strict: cliOptions.strict,
      allowFutureOASVersions: cliOptions.allowFutureOASVersions,
      strictRules: {
        requireRateLimitHeaders: cliOptions.requireRateLimitHeaders,
      },
      cache: {
        enabled: cliOptions.cacheEnabled !== false,
        maxSize: cliOptions.cacheSize,
      },
      // Performance/behaviour knobs passed to core
      fastMode: cliOptions.fast,
      noLocation: cliOptions.noLocation,
      maxErrors: cliOptions.maxErrors,
      autoFastThresholdBytes: cliOptions.autoFastThresholdBytes,
      skipExamples: cliOptions.skipExamples,
      skipPatternChecks: cliOptions.skipPatternChecks,
    };

    // Validate the plain JS object
    const result = validateOpenAPI(parsedContent, validationOptions);

    if (result.valid) {
      spinner.succeed('Validation successful! ✨');

      if (cliOptions.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('\n', chalk.green('✓'), 'Schema is valid');
        // Handle warnings if they become distinct later
      }
    } else {
      spinner.fail('Validation failed');

      let errorCount = 0;
      let warningCount = 0;

      const issues = result.errors?.issues || [];

      const issuesWithLocation = issues.map((issue) => {
        let location: Range | undefined = undefined;
        const pathArr = issue.path as unknown as (string | number)[];
        if (jsonAst) {
          location = getLocationFromJsonAst(fileContent, jsonAst, pathArr);
        } else if (yamlDoc) {
          location = getLocationFromYamlAst(fileContent, yamlDoc, pathArr);
        }

        return { ...issue, location };
      });

      issuesWithLocation.forEach((issue) => {
        const severity = getIssueSeverity(issue);
        if (severity === 'error') {
          errorCount++;
        } else {
          warningCount++;
        }
      });

      // Detect OpenAPI version from parsed content
      const docAsObject = parsedContent as Record<string, unknown>;
      const specVersion =
        typeof docAsObject.openapi === 'string' ? docAsObject.openapi : '3.1.0';

      if (cliOptions.format === 'json') {
        const outputIssues = issuesWithLocation.map((issue) => {
          const severity = getIssueSeverity(issue);
          const specLink = getOASSpecLink(issue, specVersion);
          const enhanced = enhanceZodIssue(
            {
              code: issue.code,
              path: issue.path as (string | number)[],
              message: issue.message,
              expected: (issue as any).expected,
              received: (issue as any).received,
              validation: (issue as any).validation,
            },
            specVersion
          );

          return {
            ...issue,
            code: enhanced.code,
            category: enhanced.category,
            severity,
            suggestion: enhanced.suggestion,
            specLink: specLink || enhanced.specLink,
          };
        });
        console.log(JSON.stringify({ errors: outputIssues }, null, 2));
      } else {
        console.log(
          '\n',
          chalk.red('✗'),
          `Validation found ${errorCount} error(s) and ${warningCount} warning(s):`
        );

        issuesWithLocation.forEach((issue) => {
          const severity = getIssueSeverity(issue);

          // Extract the most specific error from potentially nested union errors
          const extracted = extractMostSpecificError(issue);
          const displayPath: (string | number)[] = extracted.path;
          const displayMessage = extracted.message;

          const pathString = displayPath.map((p) => String(p)).join('.');

          // Get enhanced error info
          const enhanced = enhanceZodIssue(
            {
              code: issue.code,
              path: (issue.path as Array<string | number>).filter(
                (p): p is string | number =>
                  typeof p === 'string' || typeof p === 'number'
              ),
              message: issue.message,
              expected: (issue as any).expected,
              received: (issue as any).received,
              validation: (issue as any).validation,
            },
            specVersion
          );

          const specLink =
            getOASSpecLink(issue, specVersion) || enhanced.specLink;
          const valueContext = getValueFromPath(
            parsedContent,
            displayPath as (string | number)[]
          );
          const formattedValue = formatValueForCli(valueContext);

          // Get suggestion (from enhanced or warning patterns)
          const suggestion =
            enhanced.suggestion ||
            getWarningSuggestion(issue.path.join('.'), issue.code);

          let locationString = '';
          if (issue.location?.start) {
            locationString = chalk.cyan(` L${issue.location.start.line}`);
          }

          const severitySymbol =
            severity === 'error' ? chalk.red('•') : chalk.yellow('▲');
          const severityLabel = severity === 'error' ? 'Error' : 'Warning';
          const pathColor =
            severity === 'error' ? chalk.redBright : chalk.yellowBright;
          const codeColor = severity === 'error' ? chalk.cyan : chalk.magenta;

          // Build Output String
          const outputLines = [];

          // Header with code and path
          outputLines.push(
            `\n${severitySymbol} [${codeColor(enhanced.code)}] ${pathColor(pathString)}${locationString}`
          );

          // Message
          outputLines.push(
            `  ${severityLabel}: ${chalk.white(displayMessage)}`
          );

          // Suggestion
          if (suggestion) {
            outputLines.push(
              `  ${chalk.green('💡 Suggestion:')} ${chalk.white(suggestion)}`
            );
          }

          // Spec link
          if (specLink) {
            outputLines.push(
              `  ${chalk.blue('📖 Spec:')} ${chalk.blue.underline(specLink)}`
            );
          }

          // Value context
          if (
            valueContext !== undefined ||
            displayMessage.toLowerCase().includes('invalid')
          ) {
            if (formattedValue.includes('\n')) {
              outputLines.push(`  ${chalk.gray('Value:')}`);
              outputLines.push(
                formattedValue.startsWith('  ')
                  ? formattedValue
                  : `  ${formattedValue}`
              );
            } else {
              outputLines.push(
                `  ${chalk.gray('Value:')}    ${formattedValue}`
              );
            }
          }

          // Expected/Received
          if ('expected' in issue) {
            outputLines.push(
              `  ${chalk.gray('Expected:')} ${chalk.cyan(String(issue.expected))}`
            );
          }
          if ('received' in issue && issue.received !== undefined) {
            outputLines.push(
              `  ${chalk.gray('Received:')} ${chalk.magenta(String(issue.received))}`
            );
          }

          console.log(outputLines.join('\n'));
        });
      }

      if (errorCount > 0) {
        process.exit(1);
      } else {
        // Decide on exit code for warnings only. For now, let's keep 0 for simplicity.
        // process.exit(0);
      }
    }
  } catch (err) {
    spinner.fail('Validation failed');
    if (err instanceof Error) {
      console.error(chalk.red('\n❌ Error:'), err.message);
    } else {
      console.error(chalk.red('\n❌ An unexpected error occurred'));
    }
    process.exit(1);
  }
}

/**
 * Runs the interactive CLI wizard
 * @returns User selected options and file path
 */
async function runInteractiveMode(): Promise<{
  filePath: string;
  options: CLIOptions;
}> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'filePath',
      message: '📄 Path to OpenAPI specification:',
      validate: (input: string) => {
        if (!fs.existsSync(input)) {
          return 'File does not exist';
        }
        const ext = path.extname(input).toLowerCase();
        if (!['.yaml', '.yml', '.json'].includes(ext)) {
          return 'File must be YAML or JSON';
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'strict',
      message: '🔍 Enable strict validation?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'allowFutureOASVersions',
      message: '🔄 Allow future OpenAPI versions?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'requireRateLimitHeaders',
      message: '⚡ Require rate limiting headers?',
      default: false,
    },
    {
      type: 'list',
      name: 'format',
      message: '📊 Output format:',
      choices: [
        { name: 'Pretty (human readable)', value: 'pretty' },
        { name: 'JSON', value: 'json' },
      ],
    },
    {
      type: 'confirm',
      name: 'saveConfig',
      message: '💾 Save these settings as default?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'cacheEnabled',
      message: '💾 Enable validation caching?',
      default: true,
    },
    {
      type: 'number',
      name: 'cacheSize',
      message: '💾 Set maximum cache size:',
      default: 100,
      validate: (input: number) => {
        if (input < 1 || input > 1000) {
          return 'Cache size must be between 1 and 1000';
        }
        return true;
      },
    },
  ]);

  if (answers.saveConfig) {
    const config: ConfigFile = {
      strict: answers.strict,
      allowFutureOASVersions: answers.allowFutureOASVersions,
      requireRateLimitHeaders: answers.requireRateLimitHeaders,
      format: answers.format,
      cache: {
        enabled: answers.cacheEnabled,
        maxSize: answers.cacheSize,
      },
    };

    await fs.promises.writeFile(
      '.oas-validate.json',
      JSON.stringify(config, null, 2)
    );
    console.log(chalk.green('\n✅ Configuration saved to .oas-validate.json'));
  }

  return {
    filePath: answers.filePath,
    options: {
      strict: answers.strict,
      allowFutureOASVersions: answers.allowFutureOASVersions,
      requireRateLimitHeaders: answers.requireRateLimitHeaders,
      format: answers.format,
      cacheEnabled: answers.cacheEnabled,
      cacheSize: answers.cacheSize,
    },
  };
}

/**
 * Main CLI entry point
 * @param args - Command line arguments
 */
export async function runCLI(args: string[]): Promise<void> {
  const quiet =
    args.includes('--quiet') || args.includes('-q') || !process.stdout.isTTY;
  if (!quiet) displayWelcome();

  const program = new Command()
    .name('oas-validate')
    .description(
      'Modern OpenAPI Specification validator with enhanced reporting'
    )
    .version(packageJson.version)
    .argument('[file]', 'OpenAPI specification file (YAML or JSON)')
    .option('-s, --strict', 'Enable strict validation mode')
    .option('-f, --future', 'Allow future OpenAPI versions')
    .option('-r, --rate-limits', 'Require rate limiting headers')
    .option('-j, --json', 'Output results in JSON format')
    .option('-i, --interactive', 'Run in interactive mode')
    .option('-c, --config <path>', 'Path to config file')
    .option('--no-cache', 'Disable validation caching')
    .option('--cache-size <size>', 'Set maximum cache size', parseInt)
    // Performance/behaviour knobs
    .option('--fast', 'Enable fast mode (skips heavy checks)')
    .option('--no-location', 'Skip computing locations for errors')
    .option('--max-errors <n>', 'Cap number of reported errors', parseInt)
    .option(
      '--auto-fast-threshold <bytes>',
      'Auto-enable fast mode above this size (bytes)',
      parseInt
    )
    .option('--skip-examples', 'Skip example validations')
    .option('--skip-pattern-checks', 'Skip string pattern validations')
    .option('-q, --quiet', 'Suppress banner and spinner output');

  program.parse(args);

  const opts = program.opts();
  const [file] = program.args;

  try {
    let options: CLIOptions = {
      strict: false,
      allowFutureOASVersions: false,
      requireRateLimitHeaders: false,
      format: 'pretty',
      cacheEnabled: true,
      cacheSize: 100,
    };

    // Load config file if specified
    if (opts.config) {
      const config = await loadConfig(opts.config);
      options = { ...options, ...config };
    }

    // Override with command line options
    options = {
      ...options,
      strict: opts.strict ?? options.strict,
      allowFutureOASVersions: opts.future ?? options.allowFutureOASVersions,
      requireRateLimitHeaders:
        opts.rateLimits ?? options.requireRateLimitHeaders,
      format: opts.json ? 'json' : options.format,
      cacheEnabled: opts.noCache !== true,
      cacheSize: opts.cacheSize,
      fast: opts.fast ?? options.fast,
      noLocation: opts.noLocation ?? options.noLocation,
      maxErrors:
        typeof opts.maxErrors === 'number' ? opts.maxErrors : options.maxErrors,
      autoFastThresholdBytes:
        typeof opts.autoFastThreshold === 'number'
          ? opts.autoFastThreshold
          : options.autoFastThresholdBytes,
      skipExamples: opts.skipExamples ?? options.skipExamples,
      skipPatternChecks: opts.skipPatternChecks ?? options.skipPatternChecks,
      quiet,
    };

    if (opts.interactive || !file) {
      const result = await runInteractiveMode();
      await validateSpec(result.filePath, { ...options, ...result.options });
    } else {
      // Use fs.stat to pre-compute file size and set auto-fast threshold
      try {
        const stat = await fs.promises.stat(file);
        if (!options.autoFastThresholdBytes) {
          options.autoFastThresholdBytes = 15 * 1024 * 1024; // default
        }
        // If file is huge and user didn't force locations, prefer noLocation fast parsing
        if (
          stat.size > options.autoFastThresholdBytes &&
          options.noLocation !== false
        ) {
          options.noLocation = true;
        }
      } catch {
        // ignore stat errors; proceed
      }
      await validateSpec(file, options);
    }
  } catch (err) {
    console.error(
      chalk.red('\n❌ Error:'),
      err instanceof Error ? err.message : String(err)
    );
    process.exit(1);
  }
}

// Only run CLI if not in test mode
if (process.env.NODE_ENV !== 'test') {
  runCLI(process.argv).catch((error: Error) => {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  });
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: oas-validate [options] [file]

Options:
  --help, -h     Show this help message
  --version, -v  Show version number
  --strict       Enable strict validation mode
  --future       Allow future OpenAPI versions
  --rate-limits  Require rate limiting headers
  --json         Output results in JSON format
  
Examples:
  $ oas-validate openapi.json
  $ oas-validate --strict swagger.yaml
  `);
  process.exit(0);
}

// Show version if requested
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(`v${packageJson.version}`);
  process.exit(0);
}
