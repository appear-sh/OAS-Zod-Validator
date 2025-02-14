import * as fs from 'node:fs';
import { validateFromYaml } from './src/utils/validateFromYaml.js';
import { ValidationOptions } from './src/schemas/validator.js';
import chalk from 'chalk';
import { ZodIssue } from 'zod';
import { fileURLToPath } from 'url';
import path from 'path';
import { Command } from 'commander';

// Get the current file's directory path
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

// Error handling utilities
const formatZodError = (issue: ZodIssue): string[] => {
  const messages: string[] = [
    chalk.yellow(`Path: ${issue.path.join('.')}`),
    chalk.red(`Error: ${issue.message}`)
  ];

  switch (issue.code) {
    case 'invalid_type':
      messages.push(
        chalk.dim(`Expected: ${issue.expected}`),
        chalk.dim(`Received: ${issue.received}`)
      );
      break;
    case 'invalid_union':
      if (issue.unionErrors?.length > 0) {
        messages.push(chalk.dim(`Union Errors: ${issue.unionErrors.map(e => e.message).join(', ')}`));
      }
      break;
    case 'invalid_enum_value':
      messages.push(chalk.dim(`Expected one of: ${issue.options.join(', ')}`));
      break;
    case 'unrecognized_keys':
      messages.push(chalk.dim(`Unrecognized keys: ${issue.keys.join(', ')}`));
      break;
  }

  return messages;
};

export interface CLIOptions {
  strict?: boolean;
  allowFuture?: boolean;
  requireRateLimits?: boolean;
  help?: boolean;
}

export function runCLI(args: string[]): void {
  const program = new Command();
  
  // Override Commander.js's exit behavior
  program.exitOverride((err) => {
    throw new Error(`process.exit called with "${err.exitCode}"`);
  });
  
  program
    .name('oas-zod-validator')
    .description('OpenAPI Specification validator built with Zod')
    .argument('[file]', 'YAML file to validate')
    .option('--strict', 'Enable strict validation')
    .option('--allow-future', 'Allow future OAS versions')
    .option('--require-rate-limits', 'Require rate limit headers')
    .option('--help', 'Show help')
    .allowUnknownOption(true);

  program.parse(args);

  const options = program.opts<CLIOptions>();
  const fileName = program.args[0];

  if (!fileName || options.help) {
    console.log('\nOAS-Zod-Validator CLI');
    console.log('\nUsage:');
    console.log('  oas-zod-validator <path-to-yaml> [options]\n');
    console.log('Options:');
    console.log('  --strict                Enable strict validation');
    console.log('  --allow-future          Allow future OAS versions');
    console.log('  --require-rate-limits   Require rate limit headers');
    console.log('  --help                  Show this help message\n');
    process.exit(0);
    return;
  }

  // Prepare validation options
  const validationOptions: ValidationOptions = {
    strict: options.strict ?? false,
    allowFutureOASVersions: options.allowFuture ?? false,
    strictRules: {
      requireRateLimitHeaders: options.requireRateLimits ?? false
    }
  };

  // Log validation message before any potential error handling
  console.log('🔍 Validating OpenAPI Specification...');

  let yamlContent: string;
  try {
    yamlContent = fs.readFileSync(fileName, 'utf-8');
  } catch (err) {
    console.error('Error reading file:', err);
    process.exit(1);
    return;
  }

  try {
    const result = validateFromYaml(yamlContent, validationOptions);
    
    if (result.valid) {
      console.log('API Surface Analysis:');
      
      if (result.resolvedRefs?.length > 0) {
        console.log('Resolved references:');
        result.resolvedRefs.forEach((ref: string) => {
          console.log(`  ${ref}`);
        });
      }
      
      process.exit(0);
    } else {
      console.error('❌ Validation failed:');
      
      if (result.errors?.issues) {
        result.errors.issues.forEach((issue: ZodIssue) => {
          const messages = formatZodError(issue);
          messages.forEach(msg => console.error(msg));
        });
      }
      
      process.exit(1);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error('YAML Parsing Error:', err.message);
    } else {
      console.error('YAML Parsing Error:', String(err));
    }
    process.exit(1);
  }
}

// Only run CLI when executed directly
if (import.meta.url.startsWith('file:') && 
    process.argv[1] === fileURLToPath(import.meta.url)) {
  runCLI(process.argv);
}
