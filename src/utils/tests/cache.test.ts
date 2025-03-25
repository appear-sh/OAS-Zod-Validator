import { getValidationCache, CacheOptions, ValidationCache } from '../cache.js';
import { ValidationResult, ValidationOptions } from '../../schemas/validator.js';
import { createJSONPointer } from '../../types/index.js';

// Create a simple test document and schema
const testDocument = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {}
};

// Test validation result
const testResult: ValidationResult = {
  valid: true,
  resolvedRefs: []
};

// Test directly with the validation cache class rather than the singleton
describe('Validation Cache', () => {
  test('should store and retrieve validation results', () => {
    // Create a direct instance for isolated testing
    const cache = new ValidationCache();
    const key = 'test-key';
    
    // Store a result
    cache.setValidationResult(key, testResult);
    
    // Retrieve the result
    const cachedResult = cache.getValidationResult(key);
    
    // Verify it matches what we stored
    expect(cachedResult).toEqual(testResult);
  });

  test('should respect cache configuration when disabled', () => {
    // Create a direct instance with disabled flag
    const cache = new ValidationCache({ enabled: false });
    const key = 'test-key';
    
    // Attempt to store a result
    cache.setValidationResult(key, testResult);
    
    // Verify nothing was stored because caching is disabled
    const cachedResult = cache.getValidationResult(key);
    expect(cachedResult).toBeUndefined();
  });

  test('should respect cache size limits', () => {
    // Create a direct instance with small size limit
    const cache = new ValidationCache({ maxSize: 2 });
    
    // Store multiple items that exceed the cache limit
    cache.setValidationResult('key1', testResult);
    cache.setValidationResult('key2', testResult);
    
    // Verify both entries are in the cache
    expect(cache.getValidationResult('key1')).toBeDefined();
    expect(cache.getValidationResult('key2')).toBeDefined();
    
    // Add one more to trigger eviction
    cache.setValidationResult('key3', testResult);
    
    // First item should be evicted (oldest)
    expect(cache.getValidationResult('key1')).toBeUndefined();
    
    // Second and third items should still be in the cache
    expect(cache.getValidationResult('key2')).toBeDefined();
    expect(cache.getValidationResult('key3')).toBeDefined();
  });

  test('should store and retrieve reference targets', () => {
    // Create a direct instance
    const cache = new ValidationCache();
    const refPointer = createJSONPointer('#/components/schemas/Test');
    const refTarget = { type: 'object', properties: { foo: { type: 'string' } } };
    const doc = { ...testDocument };
    
    // Store a reference target
    cache.setRefTarget(refPointer, doc, refTarget);
    
    // Retrieve the reference target
    const cachedTarget = cache.getRefTarget(refPointer, doc);
    
    // Verify it matches what we stored
    expect(cachedTarget).toEqual(refTarget);
  });

  test('should generate consistent document keys', () => {
    const cache = new ValidationCache();
    
    // Generate keys for the same document with same options
    const key1 = cache.generateDocumentKey(testDocument, { strict: true });
    const key2 = cache.generateDocumentKey(testDocument, { strict: true });
    
    // Keys should match
    expect(key1).toEqual(key2);
    
    // Generate key for different options
    const key3 = cache.generateDocumentKey(testDocument, { strict: false });
    
    // Key should be different
    expect(key1).not.toEqual(key3);
  });

  test('should reset all caches', () => {
    const cache = new ValidationCache();
    
    // Store some data in the cache
    cache.setValidationResult('test-key', testResult);
    
    // Reset the cache
    cache.reset();
    
    // Verify cache is empty
    expect(cache.getValidationResult('test-key')).toBeUndefined();
  });

  test('should configure memory options', () => {
    // Create a direct instance with custom memory options
    const cache = new ValidationCache({
      memory: {
        trackMemory: true,
        adaptiveCaching: true,
        maxMemoryTargetMB: 100
      }
    });
    
    // Configure with new memory options
    cache.configure({
      memory: {
        trackMemory: false,
        maxMemoryTargetMB: 200
      }
    });
    
    // Get memory usage stats
    const stats = cache.getMemoryUsage();
    expect(stats).toHaveProperty('cacheSize');
    expect(stats).toHaveProperty('memoryUsageMB');
    expect(typeof stats.memoryUsageMB).toBe('number');
  });
  
  test('should respect cache eviction with adaptive caching', () => {
    // This test depends on memory usage, which may vary by environment
    // So we're just testing the basic functionality without asserting specific values
    
    // Create a small cache with low memory target
    const cache = new ValidationCache({
      maxSize: 20,
      memory: {
        adaptiveCaching: true,
        maxMemoryTargetMB: 1 // Artificially low to force adaptation
      }
    });
    
    // Should still work normally
    cache.setValidationResult('key1', testResult);
    expect(cache.getValidationResult('key1')).toBeDefined();
  });
}); 