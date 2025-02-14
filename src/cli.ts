#!/usr/bin/env node
'use strict';

import { validateFromYaml } from './utils/validateFromYaml.js';
import { ValidationOptions } from './schemas/validator.js';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

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
}

/**
 * Configuration file interface
 */
export interface ConfigFile {
  strict?: boolean;
  allowFutureOASVersions?: boolean;
  requireRateLimitHeaders?: boolean;
  format?: 'json' | 'pretty';
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
  '#35D1BA',  // Fresh teal
  '#61C49E',  // Mint
  '#96B37C',  // Sage
  '#D39F56',  // Warm gold
  '#EE9644',  // Sunset orange
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
    color: 'cyan'
  }).start();

  try {
    const config = JSON.parse(await fs.promises.readFile(configPath, 'utf8')) as ConfigFile;
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
    color: 'cyan'
  }).start();

  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf8');
    const validationOptions: ValidationOptions = {
      strict: cliOptions.strict,
      allowFutureOASVersions: cliOptions.allowFutureOASVersions,
      strictRules: {
        requireRateLimitHeaders: cliOptions.requireRateLimitHeaders
      }
    };

    const result = validateFromYaml(fileContent, validationOptions);

    if (result.valid) {
      spinner.succeed('Validation successful! ✨');
      
      if (cliOptions.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('\n', chalk.green('✓'), 'Schema is valid');
        // Note: warnings are handled through Zod custom errors in strict mode
      }
    } else {
      spinner.fail('Validation failed');
      
      if (cliOptions.format === 'json') {
        console.log(JSON.stringify(result.errors, null, 2));
      } else {
        console.log('\n', chalk.red('✗'), 'Schema validation errors:');
        result.errors?.issues.forEach(issue => {
          console.log('\n', chalk.red('•'), `${issue.path.join('.')}`);
          console.log('  ', chalk.dim(issue.message));
          if ('expected' in issue) {
            console.log('   Expected:', chalk.cyan(issue.expected));
            console.log('   Received:', chalk.yellow(issue.received));
          }
        });
      }
      process.exit(1);
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
async function runInteractiveMode(): Promise<{ filePath: string; options: CLIOptions }> {
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
      }
    },
    {
      type: 'confirm',
      name: 'strict',
      message: '🔍 Enable strict validation?',
      default: false
    },
    {
      type: 'confirm',
      name: 'allowFutureOASVersions',
      message: '🔄 Allow future OpenAPI versions?',
      default: false
    },
    {
      type: 'confirm',
      name: 'requireRateLimitHeaders',
      message: '⚡ Require rate limiting headers?',
      default: false
    },
    {
      type: 'list',
      name: 'format',
      message: '📊 Output format:',
      choices: [
        { name: 'Pretty (human readable)', value: 'pretty' },
        { name: 'JSON', value: 'json' }
      ]
    },
    {
      type: 'confirm',
      name: 'saveConfig',
      message: '💾 Save these settings as default?',
      default: false
    }
  ]);

  if (answers.saveConfig) {
    const config: ConfigFile = {
      strict: answers.strict,
      allowFutureOASVersions: answers.allowFutureOASVersions,
      requireRateLimitHeaders: answers.requireRateLimitHeaders,
      format: answers.format
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
      format: answers.format
    }
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
    .description('Modern OpenAPI Specification validator with enhanced reporting')
    .version(packageJson.version)
    .argument('[file]', 'OpenAPI specification file (YAML or JSON)')
    .option('-s, --strict', 'Enable strict validation mode')
    .option('-f, --future', 'Allow future OpenAPI versions')
    .option('-r, --rate-limits', 'Require rate limiting headers')
    .option('-j, --json', 'Output results in JSON format')
    .option('-i, --interactive', 'Run in interactive mode')
    .option('-c, --config <path>', 'Path to config file');

  program.parse(args);

  const opts = program.opts();
  const [file] = program.args;

  try {
    let options: CLIOptions = {
      strict: false,
      allowFutureOASVersions: false,
      requireRateLimitHeaders: false,
      format: 'pretty'
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
      requireRateLimitHeaders: opts.rateLimits ?? options.requireRateLimitHeaders,
      format: opts.json ? 'json' : options.format
    };

    if (opts.interactive || !file) {
      const result = await runInteractiveMode();
      await validateSpec(result.filePath, { ...options, ...result.options });
    } else {
      await validateSpec(file, options);
    }
  } catch (err) {
    console.error(chalk.red('\n❌ Error:'), err instanceof Error ? err.message : String(err));
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