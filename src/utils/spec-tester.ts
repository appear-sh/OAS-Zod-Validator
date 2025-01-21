import { validateOpenAPI } from '../schemas/validator';
import * as fs from 'fs';
import * as path from 'path';

async function testSpec() {
  try {
    // enter the path to the spec file
    const specPath = path.join(process.cwd(), 'oas-examples', '3.0', 'json', 'appear-example-spec.json');
    const specContent = fs.readFileSync(specPath, 'utf-8');
    const spec = JSON.parse(specContent);

    // Validate the spec
    const result = await validateOpenAPI(spec);

    if (!result.valid) {
      console.error('❌ OpenAPI spec validation failed:');
      console.error(result.errors);
    } else {
      console.log('✅ OpenAPI spec is valid');
      if (result.resolvedRefs) {
        console.log('Resolved references:', result.resolvedRefs);
      }
    }
  } catch (error) {
    console.error('Error during validation:', error);
  }
}

// Run the test
testSpec();