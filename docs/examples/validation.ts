import { validateOpenAPI, ValidationOptions } from 'oas-zod-validator';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';

// Extend ValidationOptions type to include our custom options
interface ExtendedValidationOptions extends ValidationOptions {
  customFormats?: Record<string, (value: string) => boolean>;
  errorReporting?: {
    detailed: boolean;
    includeData: boolean;
  };
}

// Type for our error format
interface FormattedError {
  location: string;
  message: string;
  details: string;
  code: z.ZodIssueCode;
}

// Example 1: Basic Validation
const basicExample = () => {
  // Load and parse YAML
  const specPath = join(__dirname, 'basic.yaml');
  const spec = yaml.load(readFileSync(specPath, 'utf8'));

  // Basic validation
  const result = validateOpenAPI(spec);

  if (result.valid) {
    console.log('✅ Valid OpenAPI specification');
    console.log('📎 Resolved references:', result.resolvedRefs);
  } else {
    console.error('❌ Validation errors:', result.errors);
  }
};

// Example 2: Advanced Validation with Options
const advancedExample = () => {
  const specPath = join(__dirname, 'advanced.yaml');
  const spec = yaml.load(readFileSync(specPath, 'utf8'));

  // Validate with strict options
  const result = validateOpenAPI(spec, {
    strict: true,
    strictRules: {
      requireRateLimitHeaders: true,
    },
  } as ExtendedValidationOptions);

  if (!result.valid && result.errors) {
    console.error('Validation Errors:');
    result.errors.issues.forEach((issue) => {
      console.error(`- Path: ${issue.path.join('.')}`);
      console.error(`  Message: ${issue.message}`);
      console.error('');
    });
  }
};

// Example 3: Security Validation
const securityExample = () => {
  const specPath = join(__dirname, 'security.yaml');
  const spec = yaml.load(readFileSync(specPath, 'utf8'));

  // Validate with security options
  const result = validateOpenAPI(spec, {
    strict: true,
    strictRules: {
      requireRateLimitHeaders: true,
    },
  });

  if (!result.valid && result.errors) {
    // Group errors by code
    const errorsByType = result.errors.issues.reduce<
      Record<string, z.ZodIssue[]>
    >((acc, issue) => {
      const type = issue.code;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(issue);
      return acc;
    }, {});

    // Print grouped errors
    Object.entries(errorsByType).forEach(([type, issues]) => {
      console.error(`\n${type} Errors:`);
      issues.forEach((issue) => {
        console.error(`- ${issue.path.join('.')}: ${issue.message}`);
      });
    });
  }
};

// Example 4: Validation with Custom Error Handling
const customErrorHandlingExample = () => {
  const specPath = join(__dirname, 'advanced.yaml');
  const spec = yaml.load(readFileSync(specPath, 'utf8'));

  try {
    const result = validateOpenAPI(spec, {
      strict: true,
    } as ExtendedValidationOptions);

    if (!result.valid && result.errors) {
      // Custom error formatting
      const formatError = (issue: z.ZodIssue): FormattedError => {
        const location = issue.path.join(' > ');
        const details: string[] = [];

        if ('expected' in issue) details.push(`Expected: ${issue.expected}`);
        if ('received' in issue) details.push(`Received: ${issue.received}`);
        if ('validation' in issue)
          details.push(`Validation: ${issue.validation}`);

        return {
          location,
          message: issue.message,
          details: details.join(', '),
          code: issue.code,
        };
      };

      const formattedErrors = result.errors.issues.map(formatError);

      // Output as structured error report
      console.error(
        JSON.stringify(
          {
            valid: false,
            timestamp: new Date().toISOString(),
            errorCount: formattedErrors.length,
            errors: formattedErrors,
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    console.error('Fatal validation error:', error);
    process.exit(1);
  }
};

// Example 5: Batch Validation
const batchValidationExample = async () => {
  const specs = [
    { name: 'basic', path: join(__dirname, 'basic.yaml') },
    { name: 'advanced', path: join(__dirname, 'advanced.yaml') },
    { name: 'security', path: join(__dirname, 'security.yaml') },
  ];

  const results = await Promise.all(
    specs.map(async (spec) => {
      try {
        const content = yaml.load(readFileSync(spec.path, 'utf8'));
        const result = validateOpenAPI(content, { strict: true });
        return {
          name: spec.name,
          valid: result.valid,
          errors: result.errors?.issues || [],
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          name: spec.name,
          valid: false,
          errors: [
            { message: `Failed to process: ${(error as Error).message}` },
          ],
          timestamp: new Date().toISOString(),
        };
      }
    })
  );

  // Generate validation report
  const report = {
    summary: {
      total: results.length,
      valid: results.filter((r) => r.valid).length,
      invalid: results.filter((r) => !r.valid).length,
    },
    results: results,
  };

  console.log(JSON.stringify(report, null, 2));
};

// Run examples
const runExamples = async () => {
  console.log('Running Basic Validation Example...');
  basicExample();

  console.log('\nRunning Advanced Validation Example...');
  advancedExample();

  console.log('\nRunning Security Validation Example...');
  securityExample();

  console.log('\nRunning Custom Error Handling Example...');
  customErrorHandlingExample();

  console.log('\nRunning Batch Validation Example...');
  await batchValidationExample();
};

runExamples().catch(console.error);
