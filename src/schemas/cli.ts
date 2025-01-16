import fs from 'fs';
import { validateFromYaml } from '../utils/validateFromYaml';
import { ValidationOptions } from '../schemas/validator';

export function runCLI(args: string[]): void {
  const fileName = args[0];
  const options: ValidationOptions = {
    allowFutureOASVersions: args.includes('--allow-future'),
    strict: args.includes('--strict')
  };

  if (!fileName) {
    console.error('Usage: ts-node cli.ts <path-to-yaml> [--allow-future] [--strict]');
    process.exit(1);
  }

  try {
    const yamlContent = fs.readFileSync(fileName, 'utf-8');
    const result = validateFromYaml(yamlContent, options);
    
    if (result.valid) {
      console.log('YAML spec is valid OAS');
      process.exit(0);
    } else {
      console.error('YAML spec is invalid:', result.errors);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error reading or validating YAML file:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runCLI(process.argv.slice(2));
}
