import fs from 'fs';
// @ts-ignore
import yaml from 'js-yaml';
import path from 'path';
import { validateOpenAPI } from '../schemas/validator';

export function validateFromYAML(filePath: string) {
  const fileContents = fs.readFileSync(path.resolve(filePath), 'utf-8');
  const parsedDoc = yaml.load(fileContents);
  
  // Pass allowFutureOASVersions if you want to support 3.1 or beyond
  return validateOpenAPI(parsedDoc, { allowFutureOASVersions: true });
}

// Example usage:
if (require.main === module) {
  const fileName = process.argv[2];
  if (!fileName) {
    console.error('Usage: node validateFromYaml.js <path-to-yaml>');
    process.exit(1);
  }
  
  const result = validateFromYAML(fileName);
  if (result.valid) {
    console.log('YAML spec is valid OAS:', result.resolvedRefs);
  } else {
    console.error('YAML spec is invalid OAS:', result.errors);
  }
}
