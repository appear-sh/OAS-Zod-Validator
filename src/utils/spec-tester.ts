import { validateOpenAPI } from '../schemas/validator.js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { z } from 'zod';
import { OpenAPISpec, Operation, PathItem } from '../schemas/types.js';
import { ValidationResult } from '../schemas/validator.js';

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

export function countOperations(spec: OpenAPISpec): number {
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

export function countUnsecuredEndpoints(spec: OpenAPISpec): number {
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

export function checkBestPractices(spec: OpenAPISpec): string[] {
  const warnings: string[] = [];
  
  if (!spec.info?.description) {
    warnings.push('API description is missing');
  }
  
  // Check paths
  Object.entries(spec.paths || {}).forEach(([path, pathItem]) => {
    const item = pathItem as PathItem;
    Object.entries(item).forEach(([method, op]) => {
      if (method !== '$ref') {
        const operation = op as Operation;
        // Check responses instead of description
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
  
  // Check schemas
  if (spec.components?.schemas) {
    Object.entries(spec.components.schemas).forEach(([name, schema]) => {
      if (typeof schema === 'object' && schema && !('description' in schema)) {
        warnings.push(`Schema "${name}" is missing description`);
      }
    });
  }
  
  return warnings;
}

export function findCircularRefs(spec: OpenAPISpec): string[] {
  const circularRefs: string[] = [];
  const visited = new Set<string>();
  
  function traverse(obj: unknown, path: string[] = []): void {
    if (typeof obj !== 'object' || obj === null) return;
    
    if (obj && typeof obj === 'object' && '$ref' in obj) {
      const refPath = obj.$ref as string;
      if (visited.has(refPath)) {
        circularRefs.push(refPath);
      }
      visited.add(refPath);
    }
    
    if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        traverse(value, [...path, key]);
      });
    }
  }
  
  traverse(spec);
  return [...new Set(circularRefs)];
}

export function countExternalRefs(spec: OpenAPISpec): number {
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

export async function testSpec() {
  try {
    const specPath = path.join(process.cwd(), 'oas-examples', '3.1', 'json', 'petstore.json');
    // const specPath = path.join(process.cwd(), 'oas-examples', '3.0', 'json', 'appear-example-spec.json');
    const specContent = fs.readFileSync(specPath, 'utf-8');
    const spec = JSON.parse(specContent) as OpenAPISpec;

    // Initial spec information
    console.log(chalk.blue('\n🔍 Validating OpenAPI Specification...'));
    console.log(chalk.blue(`Version: ${spec.openapi}`));
    console.log(chalk.blue(`Title: ${spec.info?.title}`));
    console.log(chalk.blue(`Description: ${spec.info?.description || 'No description provided'}\n`));

    const result = await validateOpenAPI(spec);
    const summary = generateValidationSummary(spec, result);

    // API Surface Analysis
    console.log(chalk.white.bold('\nAPI Surface Analysis:'));
    console.log(`Endpoints: ${Object.keys(spec.paths || {}).length}`);
    console.log(`Operations: ${countOperations(spec)}`);
    console.log(`Schemas: ${Object.keys(spec.components?.schemas || {}).length}`);
    console.log(`Security Schemes: ${Object.keys(spec.components?.securitySchemes || {}).length}\n`);

    // Security Analysis
    console.log(chalk.white.bold('Security Analysis:'));
    if (spec.security) {
      console.log('Global Security:');
      spec.security.forEach((scheme: Record<string, unknown>) => {
        console.log(`  - ${Object.keys(scheme).join(', ')}`);
      });
    }
    console.log(`Endpoints without Security: ${countUnsecuredEndpoints(spec)}\n`);

    // Reference Analysis
    console.log(chalk.white.bold('Reference Analysis:'));
    console.log(`Total References: ${result.resolvedRefs.length}`);
    console.log(`Circular References: ${findCircularRefs(spec).length}`);
    console.log(`External References: ${countExternalRefs(spec)}\n`);

    // Best Practice Warnings
    console.log(chalk.yellow.bold('Best Practice Warnings:'));
    const warnings = checkBestPractices(spec);
    if (warnings.length === 0) {
      console.log(chalk.green('✓ No best practice violations found\n'));
    } else {
      warnings.forEach(warning => {
        console.log(chalk.yellow(`⚠️  ${warning}`));
      });
      console.log('');
    }

    // Validation Results
    if (!result.valid && result.errors) {
      console.log(chalk.red('❌ OpenAPI spec validation failed\n'));
      
      // Display validation summary
      console.log(chalk.white.bold('Validation Summary:'));
      console.log(`Total Objects: ${summary.total}`);
      console.log(`Valid: ${chalk.green(summary.valid)}`);
      console.log(`Invalid: ${chalk.red(summary.invalid)}\n`);

      // Display component-wise results
      if (summary.details.schemas.invalid.length > 0) {
        console.log(chalk.yellow.bold('Schema Issues:'));
        summary.details.schemas.invalid.forEach(schema => {
          console.log(chalk.red(`  ❌ ${schema}`));
        });
        console.log(chalk.green(`  ✓ ${summary.details.schemas.valid.length} valid schemas\n`));
      }

      if (summary.details.paths.invalid.length > 0) {
        console.log(chalk.yellow.bold('Path Issues:'));
        summary.details.paths.invalid.forEach(path => {
          console.log(chalk.red(`  ❌ ${path}`));
        });
        console.log(chalk.green(`  ✓ ${summary.details.paths.valid.length} valid paths\n`));
      }

      if (summary.details.components.invalid.length > 0) {
        console.log(chalk.yellow.bold('Component Issues:'));
        summary.details.components.invalid.forEach(component => {
          console.log(chalk.red(`  ❌ ${component}`));
        });
        console.log(chalk.green(`  ✓ ${summary.details.components.valid.length} valid components\n`));
      }

      // Display detailed errors
      console.log(chalk.yellow.bold('Detailed Errors:'));
      result.errors.issues.forEach((issue: z.ZodIssue) => {
        console.log(chalk.red(`\n❌ Error at ${issue.path.join('.')}`));
        console.log(`   Message: ${issue.message}`);
        console.log(`   Code: ${issue.code}`);
      });
    } else {
      console.log(chalk.green('✅ OpenAPI spec is valid\n'));
      console.log(chalk.white.bold('Validation Summary:'));
      console.log(`Total Objects: ${summary.total}`);
      console.log(`Valid Components: ${chalk.green(summary.valid)}`);
      
      // Show successful validations
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
    }
  } catch (error) {
    console.error('Error:', error);
  }
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

  // Process schemas
  if (spec.components?.schemas) {
    Object.keys(spec.components.schemas).forEach(schemaName => {
      const isValid = !result.errors?.issues.some((issue: z.ZodIssue) => 
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

  // Process paths
  if (spec.paths) {
    Object.keys(spec.paths).forEach(pathName => {
      const isValid = !result.errors?.issues.some((issue: z.ZodIssue) => 
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

  // Calculate totals
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

// Run the test
testSpec();

export { generateValidationSummary };