import fs from 'fs';
import { validateFromYaml } from '../utils/validateFromYaml';
import { ValidationOptions } from '../schemas/validator';
import chalk from 'chalk';
import { ZodIssue } from 'zod';

export function runCLI(args: string[]): void {
  const fileName = args[0];
  const options: ValidationOptions = {
    allowFutureOASVersions: args.includes('--allow-future'),
    strict: args.includes('--strict'),
    strictRules: {
      requireRateLimitHeaders: args.includes('--require-rate-limits')
    }
  };

  if (!fileName || args.includes('--help')) {
    console.log(chalk.blue('\nOAS-Zod-Validator CLI'));
    console.log(chalk.dim('\nUsage:'));
    console.log('  ts-node cli.ts <path-to-yaml> [options]\n');
    console.log(chalk.dim('Options:'));
    console.log('  --strict                Enable strict validation');
    console.log('  --allow-future          Allow future OAS versions');
    console.log('  --require-rate-limits   Require rate limit headers');
    console.log('  --help                  Show this help message\n');
    process.exit(1);
  }

  try {
    const yamlContent = fs.readFileSync(fileName, 'utf-8');
    const result = validateFromYaml(yamlContent, options);
    
    if (result.valid) {
      console.log(chalk.green('\n✅ YAML spec is valid OAS'));
      if (result.resolvedRefs.length > 0) {
        console.log(chalk.blue('\nResolved references:'));
        result.resolvedRefs.forEach(ref => {
          console.log(chalk.dim(`  ${ref}`));
        });
      }
      process.exit(0);
    } else {
      console.error(chalk.red('\n❌ YAML spec is invalid:'));
      result.errors?.issues.forEach((issue: ZodIssue) => {
        console.error(chalk.yellow(`\nPath: ${issue.path.join('.')}`));
        console.error(chalk.red(`Error: ${issue.message}`));
        
        // Handle different types of Zod issues
        switch (issue.code) {
          case 'invalid_type':
            console.error(chalk.dim(`Expected: ${issue.expected}`));
            console.error(chalk.dim(`Received: ${issue.received}`));
            break;
          case 'invalid_union':
            console.error(chalk.dim(`Union Errors: ${issue.unionErrors.map(e => e.message).join(', ')}`));
            break;
          case 'invalid_enum_value':
            console.error(chalk.dim(`Expected one of: ${issue.options.join(', ')}`));
            break;
          case 'unrecognized_keys':
            console.error(chalk.dim(`Unrecognized keys: ${issue.keys.join(', ')}`));
            break;
          // Add other cases as needed
        }
      });
      process.exit(1);
    }
  } catch (err) {
    console.error(chalk.red('\nError reading or validating YAML file:'), err);
    process.exit(1);
  }
}

if (require.main === module) {
  runCLI(process.argv.slice(2));
}
