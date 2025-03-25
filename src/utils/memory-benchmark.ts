import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateOpenAPI, resetCache } from '../index.js';
import { load } from 'js-yaml';
import { getMemoryUsageMB, runGC, trackMemoryUsage } from './memoryUtils.js';
import { getValidationCache } from './cache.js';

// Get directory path for this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to example OAS files
const examplesDir = path.join(__dirname, '../../oas-examples');

/**
 * Run memory usage benchmark for validation with various caching settings
 */
async function runMemoryBenchmark() {
  console.log('🧠 Starting OAS Zod Validator memory benchmark\n');
  
  // Load test files
  const trainTravelPath = path.join(examplesDir, '3.1/json/train-travel.json');
  const discriminatorsPath = path.join(examplesDir, '3.0/json/discriminators.json');
  
  if (!fs.existsSync(trainTravelPath) || !fs.existsSync(discriminatorsPath)) {
    console.error('Example files not found. Please ensure the oas-examples directory exists.');
    process.exit(1);
  }
  
  const trainTravel = JSON.parse(fs.readFileSync(trainTravelPath, 'utf8'));
  const discriminators = JSON.parse(fs.readFileSync(discriminatorsPath, 'utf8'));
  
  // Helper to display memory stats
  const printMemoryStats = (name: string, stats: {
    heapUsedStart: number;
    heapUsedEnd: number;
    delta: number;
    operationUsage: number;
  }) => {
    console.log(`${name}:`);
    console.log(`  - Heap before: ${stats.heapUsedStart.toFixed(2)} MB`);
    console.log(`  - Heap after: ${stats.heapUsedEnd.toFixed(2)} MB`);
    console.log(`  - Memory increase: ${stats.delta.toFixed(2)} MB`);
    console.log();
  };
  
  // Run garbage collection if available
  runGC();
  
  console.log('📊 Test 1: Memory usage with different cache sizes');
  console.log('───────────────────────────────────────────────────');
  
  // Test with small cache
  resetCache();
  const smallCacheStats = trackMemoryUsage(() => {
    validateOpenAPI(trainTravel, { 
      strict: true,
      cache: { 
        enabled: true,
        maxSize: 50
      }
    });
  }, true).stats;
  
  printMemoryStats('Small cache (50 entries)', smallCacheStats);
  
  // Test with medium cache
  resetCache();
  const mediumCacheStats = trackMemoryUsage(() => {
    validateOpenAPI(trainTravel, { 
      strict: true,
      cache: { 
        enabled: true,
        maxSize: 500
      }
    });
  }, true).stats;
  
  printMemoryStats('Medium cache (500 entries)', mediumCacheStats);
  
  // Test with large cache
  resetCache();
  const largeCacheStats = trackMemoryUsage(() => {
    validateOpenAPI(trainTravel, { 
      strict: true,
      cache: { 
        enabled: true,
        maxSize: 5000
      }
    });
  }, true).stats;
  
  printMemoryStats('Large cache (5000 entries)', largeCacheStats);
  
  console.log('📊 Test 2: Memory usage with adaptive caching');
  console.log('────────────────────────────────────────────');
  
  // Test with adaptive caching (artificially low memory target)
  resetCache();
  const adaptiveCacheStats = trackMemoryUsage(() => {
    validateOpenAPI(trainTravel, { 
      strict: true,
      cache: { 
        enabled: true,
        maxSize: 1000,
        memory: {
          adaptiveCaching: true,
          maxMemoryTargetMB: smallCacheStats.heapUsedEnd // Use a tight limit
        }
      }
    });
  }, true).stats;
  
  printMemoryStats('Adaptive caching with low memory target', adaptiveCacheStats);
  
  // Test with adaptive caching (moderate memory target)
  resetCache();
  const adaptiveModerateCacheStats = trackMemoryUsage(() => {
    validateOpenAPI(trainTravel, { 
      strict: true,
      cache: { 
        enabled: true,
        maxSize: 1000,
        memory: {
          adaptiveCaching: true,
          maxMemoryTargetMB: largeCacheStats.heapUsedEnd // Use a comfortable limit
        }
      }
    });
  }, true).stats;
  
  printMemoryStats('Adaptive caching with moderate memory target', adaptiveModerateCacheStats);
  
  console.log('📊 Test 3: Memory usage with multiple validation rounds');
  console.log('───────────────────────────────────────────────────────');
  
  // Prepare a large schema with many repeating elements
  const largeSchema: {
    openapi: string;
    info: { title: string; version: string };
    paths: Record<string, any>;
  } = {
    openapi: '3.0.0',
    info: { title: 'Memory Test API', version: '1.0.0' },
    paths: {}
  };
  
  // Add many paths to create a larger schema
  for (let i = 0; i < 500; i++) {
    largeSchema.paths[`/path${i}`] = {
      get: {
        parameters: [
          { name: 'param1', in: 'query', schema: { type: 'string' } },
          { name: 'param2', in: 'query', schema: { type: 'integer', format: 'int32' } }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    tags: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }
  
  // Test multiple validation rounds with memory tracking
  resetCache();
  
  console.log('Multiple validation rounds with cache:');
  
  // Initial memory usage
  const initialMemory = getMemoryUsageMB();
  console.log(`  - Initial memory: ${initialMemory.toFixed(2)} MB`);
  
  // First validation
  const firstRoundStats = trackMemoryUsage(() => {
    validateOpenAPI(largeSchema, { strict: true });
  }).stats;
  console.log(`  - After first validation: ${firstRoundStats.heapUsedEnd.toFixed(2)} MB (+${firstRoundStats.delta.toFixed(2)} MB)`);
  
  // Second validation
  const secondRoundStats = trackMemoryUsage(() => {
    validateOpenAPI(largeSchema, { strict: true });
  }).stats;
  console.log(`  - After second validation: ${secondRoundStats.heapUsedEnd.toFixed(2)} MB (+${secondRoundStats.delta.toFixed(2)} MB)`);
  
  // Run 10 more times
  const multipleRoundStats = trackMemoryUsage(() => {
    for (let i = 0; i < 10; i++) {
      validateOpenAPI(largeSchema, { strict: true });
    }
  }).stats;
  console.log(`  - After 10 more validations: ${multipleRoundStats.heapUsedEnd.toFixed(2)} MB (+${multipleRoundStats.delta.toFixed(2)} MB)`);
  
  // Check cache size
  const cache = getValidationCache();
  const { cacheSize, memoryUsageMB } = cache.getMemoryUsage();
  console.log(`  - Current cache size: ${cacheSize} entries`);
  console.log(`  - Current memory usage: ${memoryUsageMB.toFixed(2)} MB`);
  
  console.log('\n✅ Memory benchmark complete.');
}

// Run the benchmark if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMemoryBenchmark().catch(err => {
    console.error('Benchmark failed:', err);
    process.exit(1);
  });
}

export { runMemoryBenchmark }; 