import { memoize } from '../memoize.js';

describe('memoize', () => {
  // Manual mocking approach instead of jest.fn()
  let callCount: number;
  let mockFn: (a: number, b: number) => number;
  let memoizedFn: (a: number, b: number) => number;
  
  beforeEach(() => {
    callCount = 0;
    mockFn = (a: number, b: number) => {
      callCount++;
      return a + b;
    };
    memoizedFn = memoize(mockFn);
  });
  
  test('should return the correct result', () => {
    expect(memoizedFn(1, 2)).toBe(3);
  });
  
  test('should call the original function only once for the same arguments', () => {
    // First call
    memoizedFn(1, 2);
    expect(callCount).toBe(1);
    
    // Second call with same args - should use cache
    memoizedFn(1, 2);
    expect(callCount).toBe(1); // Still 1 because it used cache
    
    // Different args - should call original function
    memoizedFn(2, 3);
    expect(callCount).toBe(2);
  });
  
  test('should respect maxSize option', () => {
    callCount = 0;
    const smallCacheFn = memoize(mockFn, { maxSize: 2 });
    
    // Fill the cache
    smallCacheFn(1, 1);
    smallCacheFn(2, 2);
    expect(callCount).toBe(2);
    
    // This should evict the oldest entry (1,1)
    smallCacheFn(3, 3);
    expect(callCount).toBe(3);
    
    // These calls should use cache
    smallCacheFn(2, 2);
    smallCacheFn(3, 3);
    expect(callCount).toBe(3); // Still 3 because it used cache
    
    // This should call original function since it was evicted
    smallCacheFn(1, 1);
    expect(callCount).toBe(4);
  });
  
  test('should use custom key function', () => {
    callCount = 0;
    const customFn = (a: number, b: number) => {
      callCount++;
      return a + b;
    };
    
    // Create a simpler key function that just returns the constant 'key' for any input
    // This ensures any combination of arguments will return the same key
    const customKeyFn = memoize(customFn, {
      keyFn: () => 'key'
    });
    
    // First call
    customKeyFn(1, 2);
    expect(callCount).toBe(1);
    
    // Completely different arguments, but same key with our custom keyFn
    customKeyFn(100, 200);
    // Should still be 1 because the key is always 'key'
    expect(callCount).toBe(1);
  });
}); 