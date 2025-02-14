import * as fs from 'node:fs';
import { validateFromYaml } from './utils/validateFromYaml.js';
import { ValidationOptions, ValidationResult } from './schemas/validator.js';
import chalk from 'chalk';
import { ZodIssue } from 'zod';
import { fileURLToPath } from 'url';
import path from 'path';
import { Command } from 'commander';
import { OpenAPISpec, Operation, PathItem } from './schemas/types.js';
import yaml from 'js-yaml';

// Get the current file's directory path
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

// Validation summary interface
interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  details: {
    schemas: { valid: string[]; invalid: string[] };
    paths: { valid: string[]; invalid: string[] };
    components: { valid: string[]; invalid: string[] };
  };
}

// Analysis utilities
function countOperations(spec: OpenAPISpec): number {
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
  let count = 0;
  
  Object.entries(spec.paths || {}).forEach(([_, pathItem]) => {
    const item = pathItem as PathItem;
    methods.forEach(method => {
      if (item[method as keyof PathItem]) count++;
    });
  });
  
  return count;
}

function countUnsecuredEndpoints(spec: OpenAPISpec): number {
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
  let count = 0;
  
  Object.entries(spec.paths || {}).forEach(([_, pathItem]) => {
    const item = pathItem as PathItem;
    methods.forEach(method => {
      const operation = item[method as keyof PathItem] as Operation | undefined;
      if (operation && !spec.security) {
        count++;
      }
    });
  });
  
  return count;
}

function checkBestPractices(spec: OpenAPISpec): string[] {
  const warnings: string[] = [];
  
  if (!spec.info?.description) {
    warnings.push('API description is missing');
  }
  
  Object.entries(spec.paths || {}).forEach(([path, pathItem]) => {
    const item = pathItem as PathItem;
    Object.entries(item).forEach(([method, op]) => {
      if (method !== '$ref') {
        const operation = op as Operation;
        if (!operation.responses) {
          warnings.push(`Operation ${method.toUpperCase()} ${path} is missing responses`);
        } else {
          const hasSuccessResponse = Object.keys(operation.responses)
            .some(code => code.startsWith('2'));
          if (!hasSuccessResponse) {
            warnings.push(`Operation ${method.toUpperCase()} ${path} is missing success response`);
          }
        }
      }
    });
  });
  
  if (spec.components?.schemas) {
    Object.entries(spec.components.schemas).forEach(([name, schema]) => {
      if (typeof schema === 'object' && schema && !('description' in schema)) {
        warnings.push(`Schema "${name}" is missing description`);
      }
    });
  }
  
  return warnings;
}

function findCircularRefs(spec: OpenAPISpec): string[] {
  const circularRefs: string[] = [];
  const visitedPaths = new Set<string>();
  
  function traverse(obj: unknown, currentPath: string[] = []): void {
    if (typeof obj !== 'object' || obj === null) return;
    
    const pathStr = currentPath.join('/');
    if (visitedPaths.has(pathStr)) return;
    visitedPaths.add(pathStr);
    
    if ('$ref' in obj && typeof obj.$ref === 'string') {
      const refPath = obj.$ref;
      const refParts = refPath.split('/');
      
      const targetPath = refParts.slice(1).join('/');
      const currentPathStr = currentPath.join('/');
      if (currentPathStr.includes(targetPath)) {
        circularRefs.push(refPath);
        return;
      }
      
      let target = spec;
      for (let i = 1; i < refParts.length; i++) {
        if (target && typeof target === 'object') {
          target = target[refParts[i] as keyof typeof target];
        }
      }
      
      if (target && typeof target === 'object') {
        traverse(target, [...currentPath, refPath]);
      }
    }
    
    for (const [key, value] of Object.entries(obj)) {
      traverse(value, [...currentPath, key]);
    }
  }
  
  traverse(spec);
  return [...new Set(circularRefs)];
}

function countExternalRefs(spec: OpenAPISpec): number {
  let count = 0;
  
  function traverse(obj: unknown): void {
    if (typeof obj !== 'object' || obj === null) return;
    
    if (obj && typeof obj === 'object' && '$ref' in obj) {
      const ref = obj.$ref as string;
      if (!ref.startsWith('#/')) {
        count++;
      }
    }
    
    if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(traverse);
    }
  }
  
  traverse(spec);
  return count;
}

function generateValidationSummary(spec: OpenAPISpec, result: ValidationResult): ValidationSummary {
  const summary: ValidationSummary = {
    total: 0,
    valid: 0,
    invalid: 0,
    details: {
      schemas: { valid: [], invalid: [] },
      paths: { valid: [], invalid: [] },
      components: { valid: [], invalid: [] }
    }
  };

  if (spec.components?.schemas) {
    Object.keys(spec.components.schemas).forEach(schemaName => {
      const isValid = !result.errors?.issues.some((issue: ZodIssue) => 
        issue.path[0] === 'components' && 
        issue.path[1] === 'schemas' && 
        issue.path[2] === schemaName
      );
      
      if (isValid) {
        summary.details.schemas.valid.push(schemaName);
      } else {
        summary.details.schemas.invalid.push(schemaName);
      }
    });
  }

  if (spec.paths) {
    Object.keys(spec.paths).forEach(pathName => {
      const isValid = !result.errors?.issues.some((issue: ZodIssue) => 
        issue.path[0] === 'paths' && 
        issue.path[1] === pathName
      );
      
      if (isValid) {
        summary.details.paths.valid.push(pathName);
      } else {
        summary.details.paths.invalid.push(pathName);
      }
    });
  }

  summary.total = 
    summary.details.schemas.valid.length + 
    summary.details.schemas.invalid.length +
    summary.details.paths.valid.length +
    summary.details.paths.invalid.length +
    summary.details.components.valid.length +
    summary.details.components.invalid.length;
    
  summary.valid = 
    summary.details.schemas.valid.length +
    summary.details.paths.valid.length +
    summary.details.components.valid.length;
    
  summary.invalid = 
    summary.details.schemas.invalid.length +
    summary.details.paths.invalid.length +
    summary.details.components.invalid.length;

  return summary;
}

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
  json?: boolean;
}

export function runCLI(args: string[]): void {
  const program = new Command();
  
  program.exitOverride((err) => {
    throw new Error(`process.exit called with "${err.exitCode}"`);
  });
  
  program
    .name('oas-zod-validator')
    .description('OpenAPI Specification validator built with Zod')
    .argument('[file]', 'YAML/JSON file to validate')
    .option('--strict', 'Enable strict validation')
    .option('--allow-future', 'Allow future OAS versions')
    .option('--require-rate-limits', 'Require rate limit headers')
    .option('--json', 'Output results in JSON format')
    .option('--help', 'Show help')
    .allowUnknownOption(true);

  program.parse(args);

  const options = program.opts<CLIOptions>();
  const fileName = program.args[0];

  if (!fileName || options.help) {
    console.log('\nOAS-Zod-Validator CLI');
    console.log('\nUsage:');
    console.log('  oas-zod-validator <path-to-spec> [options]\n');
    console.log('Options:');
    console.log('  --strict                Enable strict validation');
    console.log('  --allow-future          Allow future OAS versions');
    console.log('  --require-rate-limits   Require rate limit headers');
    console.log('  --json                  Output results in JSON format');
    console.log('  --help                  Show this help message\n');
    process.exit(0);
    return;
  }

  const validationOptions: ValidationOptions = {
    strict: options.strict ?? false,
    allowFutureOASVersions: options.allowFuture ?? false,
    strictRules: {
      requireRateLimitHeaders: options.requireRateLimits ?? false
    }
  };

  console.log(chalk.blue('🔍 Validating OpenAPI Specification...'));

  try {
    const fileContent = fs.readFileSync(fileName, 'utf-8');
    const parsedSpec = yaml.load(fileContent) as OpenAPISpec;
    const result = validateFromYaml(fileContent, validationOptions);
    
    if (options.json) {
      // JSON output mode
      console.log(JSON.stringify({
        valid: result.valid,
        summary: generateValidationSummary(parsedSpec, result),
        analysis: {
          endpoints: Object.keys(parsedSpec.paths || {}).length,
          operations: countOperations(parsedSpec),
          schemas: Object.keys(parsedSpec.components?.schemas || {}).length,
          securitySchemes: Object.keys(parsedSpec.components?.securitySchemes || {}).length,
          unsecuredEndpoints: countUnsecuredEndpoints(parsedSpec),
          circularRefs: findCircularRefs(parsedSpec),
          externalRefs: countExternalRefs(parsedSpec),
          warnings: checkBestPractices(parsedSpec)
        },
        errors: result.errors?.issues || []
      }, null, 2));
      
      process.exit(result.valid ? 0 : 1);
      return;
    }

    // Initial spec information
    console.log(chalk.blue(`Version: ${parsedSpec.openapi}`));
    console.log(chalk.blue(`Title: ${parsedSpec.info?.title}`));
    console.log(chalk.blue(`Description: ${parsedSpec.info?.description || 'No description provided'}\n`));

    // API Surface Analysis
    console.log(chalk.white.bold('API Surface Analysis:'));
    console.log(`Endpoints: ${Object.keys(parsedSpec.paths || {}).length}`);
    console.log(`Operations: ${countOperations(parsedSpec)}`);
    console.log(`Schemas: ${Object.keys(parsedSpec.components?.schemas || {}).length}`);
    console.log(`Security Schemes: ${Object.keys(parsedSpec.components?.securitySchemes || {}).length}\n`);

    // Security Analysis
    console.log(chalk.white.bold('Security Analysis:'));
    if (parsedSpec.security) {
      console.log('Global Security:');
      parsedSpec.security.forEach((scheme: Record<string, unknown>) => {
        console.log(`  - ${Object.keys(scheme).join(', ')}`);
      });
    }
    console.log(`Endpoints without Security: ${countUnsecuredEndpoints(parsedSpec)}\n`);

    // Reference Analysis
    console.log(chalk.white.bold('Reference Analysis:'));
    console.log(`Total References: ${result.resolvedRefs.length}`);
    console.log(`Circular References: ${findCircularRefs(parsedSpec).length}`);
    console.log(`External References: ${countExternalRefs(parsedSpec)}\n`);

    // Best Practice Warnings
    console.log(chalk.yellow.bold('Best Practice Warnings:'));
    const warnings = checkBestPractices(parsedSpec);
    if (warnings.length === 0) {
      console.log(chalk.green('✓ No best practice violations found\n'));
    } else {
      warnings.forEach(warning => {
        console.log(chalk.yellow(`⚠️  ${warning}`));
      });
      console.log('');
    }
    
    if (result.valid) {
      const summary = generateValidationSummary(parsedSpec, result);
      console.log(chalk.green('✅ OpenAPI spec is valid\n'));
      console.log(chalk.white.bold('Validation Summary:'));
      console.log(`Total Objects: ${summary.total}`);
      console.log(`Valid Components: ${chalk.green(summary.valid)}`);
      
      if (summary.details.schemas.valid.length > 0) {
        console.log(chalk.green(`\n✓ ${summary.details.schemas.valid.length} valid schemas`));
      }
      if (summary.details.paths.valid.length > 0) {
        console.log(chalk.green(`✓ ${summary.details.paths.valid.length} valid paths`));
      }
      if (summary.details.components.valid.length > 0) {
        console.log(chalk.green(`✓ ${summary.details.components.valid.length} valid components`));
      }

      if (result.resolvedRefs) {
        console.log(chalk.green('\n✓ All references resolved successfully'));
      }
      
      process.exit(0);
    } else {
      const summary = generateValidationSummary(parsedSpec, result);
      console.log(chalk.red('❌ OpenAPI spec validation failed\n'));
      
      console.log(chalk.white.bold('Validation Summary:'));
      console.log(`Total Objects: ${summary.total}`);
      console.log(`Valid: ${chalk.green(summary.valid)}`);
      console.log(`Invalid: ${chalk.red(summary.invalid)}\n`);

      if (summary.details.schemas.invalid.length > 0) {
        console.log(chalk.yellow.bold('Schema Issues:'));
        summary.details.schemas.invalid.forEach(schema => {
          console.log(chalk.red(`  ❌ ${schema}`));
        });
      }

      if (summary.details.paths.invalid.length > 0) {
        console.log(chalk.yellow.bold('Path Issues:'));
        summary.details.paths.invalid.forEach(path => {
          console.log(chalk.red(`  ❌ ${path}`));
        });
      }

      if (summary.details.components.invalid.length > 0) {
        console.log(chalk.yellow.bold('Component Issues:'));
        summary.details.components.invalid.forEach(component => {
          console.log(chalk.red(`  ❌ ${component}`));
        });
      }

      console.log(chalk.yellow.bold('\nDetailed Errors:'));
      result.errors?.issues.forEach((issue: ZodIssue) => {
        const messages = formatZodError(issue);
        messages.forEach(msg => console.error(msg));
        console.log('');
      });
      
      process.exit(1);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(chalk.red('Parsing Error:'), err.message);
    } else {
      console.error(chalk.red('Parsing Error:'), String(err));
    }
    process.exit(1);
  }
}

// Only run CLI when executed directly
if (import.meta.url.startsWith('file:') && 
    process.argv[1] === fileURLToPath(import.meta.url)) {
  runCLI(process.argv);
}
