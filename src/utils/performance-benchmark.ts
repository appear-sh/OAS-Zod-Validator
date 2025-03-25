import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateOpenAPI, resetCache } from '../index.js';
import { load } from 'js-yaml';

// Get directory path for this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to example OAS files
const examplesDir = path.join(__dirname, '../../oas-examples');

/**
 * Simple benchmark utility
 * @returns The execution time in milliseconds
 */
function benchmark<T>(name: string, fn: () => T, iterations: number = 1): { result: T, timeMs: number } {
  const start = process.hrtime.bigint();
  
  let result: T;
  for (let i = 0; i < iterations; i++) {
    result = fn();
  }
  
  const end = process.hrtime.bigint();
  const timeMs = Number(end - start) / 1_000_000;
  
  console.log(`${name}: ${timeMs.toFixed(2)}ms`);
  
  return { result: result!, timeMs };
}

/**
 * Run the benchmark with different caching configurations
 */
async function runBenchmark() {
  console.log('🚀 Starting OAS Zod Validator performance benchmark\n');
  
  // Load test files
  const trainTravelPath = path.join(examplesDir, '3.1/json/train-travel.json');
  const discriminatorsPath = path.join(examplesDir, '3.0/json/discriminators.json');
  
  if (!fs.existsSync(trainTravelPath) || !fs.existsSync(discriminatorsPath)) {
    console.error('Example files not found. Please ensure the oas-examples directory exists.');
    process.exit(1);
  }
  
  const trainTravel = JSON.parse(fs.readFileSync(trainTravelPath, 'utf8'));
  const discriminators = JSON.parse(fs.readFileSync(discriminatorsPath, 'utf8'));
  
  console.log('📊 Test 1: Train Travel API (large spec with many references)');
  console.log('──────────────────────────────────────────────────────────');
  
  // First run without cache
  resetCache();
  benchmark('First validation (cache empty)', () => {
    validateOpenAPI(trainTravel, { strict: true });
  });
  
  // Second run with cache
  benchmark('Second validation (cached)', () => {
    validateOpenAPI(trainTravel, { strict: true });
  });
  
  // Disabled cache
  benchmark('Validation with cache disabled', () => {
    validateOpenAPI(trainTravel, { 
      strict: true,
      cache: { enabled: false }
    });
  });
  
  console.log('\n📊 Test 2: Discriminators API (complex schema composition)');
  console.log('──────────────────────────────────────────────────────────');
  
  // Reset cache
  resetCache();
  
  // First run without cache
  benchmark('First validation (cache empty)', () => {
    validateOpenAPI(discriminators, { strict: true });
  });
  
  // Second run with cache
  benchmark('Second validation (cached)', () => {
    validateOpenAPI(discriminators, { strict: true });
  });
  
  // Run with different options to test option-specific caching
  benchmark('Validation with different options (new cache entry)', () => {
    validateOpenAPI(discriminators, { 
      strict: false,
      allowFutureOASVersions: true
    });
  });
  
  console.log('\n📊 Test 3: Multiple validations in sequence (50 iterations)');
  console.log('──────────────────────────────────────────────────────────');
  
  // Reset cache
  resetCache();
  
  // Multiple validations without caching
  benchmark('50 validations with cache disabled', () => {
    for (let i = 0; i < 50; i++) {
      validateOpenAPI(discriminators, { 
        strict: true,
        cache: { enabled: false }
      });
    }
  });
  
  // Multiple validations with caching
  resetCache();
  benchmark('50 validations with caching enabled', () => {
    for (let i = 0; i < 50; i++) {
      validateOpenAPI(discriminators, { strict: true });
    }
  });
  
  console.log('\n📊 Test 4: Function Memoization Impact');
  console.log('──────────────────────────────────────');
  
  // Create a spec with many repeated types to test memoization
  const repeatedTypesSpec: {
    openapi: string;
    info: { title: string; version: string };
    paths: Record<string, any>;
  } = {
    openapi: '3.0.0',
    info: { title: 'Memoization Test API', version: '1.0.0' },
    paths: {}
  };
  
  // Add a large number of paths with similar schema structures
  for (let i = 0; i < 200; i++) {
    repeatedTypesSpec.paths[`/test${i}`] = {
      get: {
        parameters: [
          { name: 'id', in: 'query', schema: { type: 'integer', format: 'int32' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', format: 'int32' } }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', format: 'int32' },
                    name: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    };
  }
  
  resetCache();
  
  // Test memoized functions with extensive repetition
  benchmark('Validation with schema repetition - should benefit from memoization', () => {
    validateOpenAPI(repeatedTypesSpec, { strict: true });
  });
  
  console.log('\n✅ Benchmark complete.');
}

runBenchmark().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
}); 