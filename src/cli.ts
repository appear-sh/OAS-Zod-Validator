#!/usr/bin/env node
'use strict';

import { validateFromYaml } from './utils/validateFromYaml.js';
import { ValidationOptions, ValidationResult } from './schemas/validator.js';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { getOASSpecLink } from './errors/specLinks.js';
import { getIssueSeverity, Severity } from './errors/severity.js';

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
      // Use YAML dump for potentially better readability of structures
      const yamlString = yaml.dump(value, {
        indent: 2,
        lineWidth: 80,
        skipInvalid: true,
      });
      const lines = yamlString.split('\n');
      if (lines.length > 10 || yamlString.length > 300) {
        // Limit output size
        return chalk.dim('{ /* Large object/array */ }');
      }
      // Indent the YAML output slightly
      return chalk.dim(lines.map((l) => `  ${l}`).join('\n'));
    } catch (e) {
      return chalk.dim('[Unserializable Value]');
    }
  }
  // Handle numbers, booleans, null
  return chalk.dim(String(value));
}

/**
 * Validates an OpenAPI specification file
 * @param filePath - Path to the specification file
 * @param cliOptions - Validation options
 */
async function validateSpec(
  filePath: string,
  cliOptions: CLIOptions
): Promise<void> {
  const spinner = ora({
    text: 'Validating OpenAPI specification...',
    color: 'cyan',
  }).start();

  let parsedContent: any = null; // Variable to hold the parsed spec

  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf8');

    // Parse the content once for context retrieval
    try {
      if (path.extname(filePath).toLowerCase().startsWith('.y')) {
        parsedContent = yaml.load(fileContent);
      } else {
        parsedContent = JSON.parse(fileContent);
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
    };

    // For now, we'll assume it works with the string, but we have parsedContent for context.
    const result = validateFromYaml(fileContent, validationOptions);

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
      issues.forEach((issue) => {
        const severity = getIssueSeverity(issue);
        if (severity === 'error') {
          errorCount++;
        } else {
          warningCount++;
        }
      });

      if (cliOptions.format === 'json') {
        // Include severity in JSON output
        const outputIssues = issues.map((issue) => ({
          ...issue,
          severity: getIssueSeverity(issue),
        }));
        console.log(JSON.stringify({ errors: outputIssues }, null, 2));
      } else {
        console.log(
          '\n',
          chalk.red('✗'),
          `Validation found ${errorCount} error(s) and ${warningCount} warning(s):`
        );

        issues.forEach((issue) => {
          let displayPath = issue.path; // Path to display
          let displayMessage = issue.message; // Message to display

          // Check for invalid_union and try to get a more specific message
          if (
            issue.code === 'invalid_union' &&
            issue.unionErrors &&
            issue.unionErrors.length > 0
          ) {
            // Prefer the first error from the first union branch
            const firstBranchErrors = issue.unionErrors[0]?.issues;
            if (firstBranchErrors && firstBranchErrors.length > 0) {
              const specificIssue = firstBranchErrors[0];

              // If the specific nested issue path is longer (more specific) than the union's path,
              // assume it already contains the full path information needed. Otherwise, stick to the union path.
              if (specificIssue.path.length > issue.path.length) {
                displayPath = specificIssue.path;
              } // else: displayPath remains the original issue.path (path to the union)

              displayMessage = specificIssue.message;
            }
          }

          const pathString = displayPath.join('.'); // Use potentially updated path
          const specLink = getOASSpecLink(issue); // Keep using original issue for link lookup
          const valueContext = getValueFromPath(parsedContent, displayPath); // Use potentially updated path
          const formattedValue = formatValueForCli(valueContext);
          const severity = getIssueSeverity(issue); // Keep using original issue for severity

          const severitySymbol =
            severity === 'error'
              ? chalk.red('• Error')
              : chalk.yellow('▲ Warning');
          const pathColor =
            severity === 'error' ? chalk.redBright : chalk.yellowBright;

          // --- Build Output String ---
          let outputLines = [];
          // Severity and Path
          outputLines.push(`\n${severitySymbol} ${pathColor(pathString)}`);
          // Message
          outputLines.push(`  Message:  ${chalk.white(displayMessage)}`);
          // Spec Link
          if (specLink) {
            outputLines.push(`  Spec:     ${chalk.blue.underline(specLink)}`);
          }
          // Value context
          if (
            valueContext !== undefined ||
            displayMessage.toLowerCase().includes('invalid')
          ) {
            if (formattedValue.includes('\n')) {
              outputLines.push(`  Value:`);
              outputLines.push(
                formattedValue.startsWith('  ')
                  ? formattedValue
                  : `  ${formattedValue}`
              );
            } else {
              outputLines.push(`  Value:    ${formattedValue}`);
            }
          }
          // Expected/Received
          if ('expected' in issue) {
            outputLines.push(
              `  Expected: ${chalk.cyan(String(issue.expected))}`
            );
          }
          if ('received' in issue && issue.received !== undefined) {
            outputLines.push(
              `  Received: ${chalk.magenta(String(issue.received))}`
            );
          }
          // --- Print Combined Output ---
          console.log(outputLines.join('\n'));
        });
      }

      // Exit with error code 1 only if there are actual errors
      // If only warnings, exit code could be 0 (configurable later?)
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
  displayWelcome();

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
    .option('--cache-size <size>', 'Set maximum cache size', parseInt);

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
    };

    if (opts.interactive || !file) {
      const result = await runInteractiveMode();
      await validateSpec(result.filePath, { ...options, ...result.options });
    } else {
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
