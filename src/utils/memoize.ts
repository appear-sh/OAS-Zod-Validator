import { LRUCache } from './cache.js';

/**
 * Options for memoization
 */
export interface MemoizeOptions {
  /**
   * Maximum size of the memoization cache
   */
  maxSize?: number;
  
  /**
   * Custom key generation function
   */
  keyFn?: (...args: any[]) => string;
}

/**
 * Default memoization options
 */
const DEFAULT_MEMOIZE_OPTIONS: Required<MemoizeOptions> = {
  maxSize: 100,
  keyFn: (...args: any[]) => JSON.stringify(args)
};

/**
 * Memoizes a function with LRU caching
 * 
 * @param fn - The function to memoize
 * @param options - Memoization options
 * @returns The memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T, 
  options: MemoizeOptions = {}
): T {
  const opts = { ...DEFAULT_MEMOIZE_OPTIONS, ...options };
  const cache = new LRUCache<string, ReturnType<T>>(opts.maxSize);
  
  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = opts.keyFn(...args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
  
  return memoized;
} 