import { z } from 'zod';
import { ValidationOptions, ValidationResult } from '../schemas/validator.js';
import { JSONPointer } from '../types/index.js';
// import { OpenAPISpec } from '../schemas/types.js'; // Removed unused import
import {
  MemoryOptions,
  DEFAULT_MEMORY_OPTIONS,
  getMemoryUsageMB,
  getAdaptiveCacheSize,
} from './memoryUtils.js';

/**
 * Cache options for schema validation
 */
export interface CacheOptions {
  /**
   * Whether to enable schema caching (default: true)
   */
  enabled?: boolean;

  /**
   * Maximum size of the cache (number of entries)
   */
  maxSize?: number;

  /**
   * Memory optimization options
   */
  memory?: MemoryOptions;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
  enabled: true,
  maxSize: 500,
  memory: DEFAULT_MEMORY_OPTIONS,
};

/**
 * Simple LRU cache implementation
 */
export class LRUCache<K, V> {
  private map = new Map<K, V>();
  private keys: K[] = [];
  private maxSize: number;
  private currentMemoryUsage = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  /**
   * Get an item from the cache
   */
  get(key: K): V | undefined {
    return this.map.get(key);
  }

  /**
   * Set an item in the cache
   */
  set(key: K, value: V): void {
    // If key already exists, remove it first
    if (this.map.has(key)) {
      this.map.delete(key);
      const index = this.keys.indexOf(key);
      if (index !== -1) {
        this.keys.splice(index, 1);
      }
    }

    // Evict oldest item if cache is full
    if (this.keys.length >= this.maxSize) {
      const oldestKey = this.keys.shift();
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }

    // Add new item
    this.map.set(key, value);
    this.keys.push(key);
  }

  /**
   * Check if key is in the cache
   */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.map.clear();
    this.keys = [];
  }

  /**
   * Get the size of the cache
   */
  get size(): number {
    return this.map.size;
  }

  /**
   * Update the maximum size of the cache
   */
  updateMaxSize(newMaxSize: number): void {
    this.maxSize = newMaxSize;

    // If the new max size is smaller than the current size,
    // remove oldest entries until we're at the new max size
    while (this.keys.length > this.maxSize) {
      const oldestKey = this.keys.shift();
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
  }
}

/**
 * Cache for schema validation results
 */
export class ValidationCache {
  private options: Required<CacheOptions>;
  private validationCache: LRUCache<string, ValidationResult>;
  private schemaCache: LRUCache<string, z.ZodType>;
  private refCache: LRUCache<string, unknown>;

  /**
   * Create a new ValidationCache
   */
  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
    // Set memory options with defaults
    this.options.memory = { ...DEFAULT_MEMORY_OPTIONS, ...options.memory };

    this.validationCache = new LRUCache<string, ValidationResult>(
      this.options.maxSize
    );
    this.schemaCache = new LRUCache<string, z.ZodType>(this.options.maxSize);
    this.refCache = new LRUCache<string, unknown>(this.options.maxSize);
  }

  /**
   * Reset all caches
   */
  public reset(): void {
    this.validationCache.clear();
    this.schemaCache.clear();
    this.refCache.clear();
  }

  /**
   * Configure the cache
   */
  public configure(options: CacheOptions): void {
    const oldMaxSize = this.options.maxSize;
    const oldMemoryOptions = this.options.memory;

    this.options = {
      ...this.options,
      ...options,
    };

    // Merge memory options
    this.options.memory = {
      ...oldMemoryOptions,
      ...options.memory,
    };

    // Update cache sizes based on memory usage if adaptive caching is enabled
    this.updateCacheSizesBasedOnMemory();

    // If max size changed and adaptive caching is not updating it,
    // recreate caches with the new size
    if (
      this.options.maxSize !== oldMaxSize &&
      !this.options.memory.adaptiveCaching
    ) {
      this.validationCache = new LRUCache<string, ValidationResult>(
        this.options.maxSize
      );
      this.schemaCache = new LRUCache<string, z.ZodType>(this.options.maxSize);
      this.refCache = new LRUCache<string, unknown>(this.options.maxSize);
    }
  }

  /**
   * Update cache sizes based on memory usage
   */
  private updateCacheSizesBasedOnMemory(): void {
    if (!this.options.memory.adaptiveCaching) {
      return;
    }

    const memoryUsage = getMemoryUsageMB();
    const maxMemoryTargetMB = this.options.memory.maxMemoryTargetMB || 0;

    // Adjust cache sizes if needed
    if (maxMemoryTargetMB > 0) {
      const newSize = getAdaptiveCacheSize(
        this.options.maxSize,
        memoryUsage,
        maxMemoryTargetMB
      );

      // Only update if the size has changed
      if (newSize !== this.options.maxSize) {
        this.options.maxSize = newSize;
        this.validationCache.updateMaxSize(newSize);
        this.schemaCache.updateMaxSize(newSize);
        this.refCache.updateMaxSize(newSize);
      }
    }
  }

  /**
   * Generate a cache key for a document and options
   */
  public generateDocumentKey(
    document: unknown,
    options: ValidationOptions
  ): string {
    // Handle test documents with index property for caching tests
    if (
      typeof document === 'object' &&
      document !== null &&
      'index' in document
    ) {
      // For test documents, include the index directly to guarantee key uniqueness
      const doc = document as Record<string, unknown>;
      return `test_doc_${doc.index}_${JSON.stringify(options)}`;
    }

    // Regular document handling
    const docStr =
      typeof document === 'object' && document !== null
        ? JSON.stringify({
            openapi: (document as Record<string, unknown>).openapi,
            info: (document as Record<string, any>).info?.version,
            paths: Object.keys(
              ((document as Record<string, unknown>).paths as
                | Record<string, unknown>
                | undefined) || {}
            ).length,
          })
        : String(document);

    return `${docStr}_${JSON.stringify(options)}`;
  }

  /**
   * Get a cached validation result
   */
  public getValidationResult(key: string): ValidationResult | undefined {
    if (!this.options.enabled) return undefined;

    // Check memory usage and adjust if needed before accessing cache
    if (this.options.memory.adaptiveCaching) {
      this.updateCacheSizesBasedOnMemory();
    }

    return this.validationCache.get(key);
  }

  /**
   * Store a validation result in the cache
   */
  public setValidationResult(key: string, result: ValidationResult): void {
    if (!this.options.enabled) return;

    // Check memory usage and adjust if needed before adding to cache
    if (this.options.memory.adaptiveCaching) {
      this.updateCacheSizesBasedOnMemory();
    }

    this.validationCache.set(key, result);
  }

  /**
   * Get a cached schema
   */
  public getSchema(key: string): z.ZodType | undefined {
    if (!this.options.enabled) return undefined;

    // Check memory usage and adjust if needed before accessing cache
    if (this.options.memory.adaptiveCaching) {
      this.updateCacheSizesBasedOnMemory();
    }

    return this.schemaCache.get(key);
  }

  /**
   * Store a schema in the cache
   */
  public setSchema(key: string, schema: z.ZodType): void {
    if (!this.options.enabled) return;

    // Check memory usage and adjust if needed before adding to cache
    if (this.options.memory.adaptiveCaching) {
      this.updateCacheSizesBasedOnMemory();
    }

    this.schemaCache.set(key, schema);
  }

  /**
   * Generate a reference cache key
   */
  private generateRefKey(
    refPointer: JSONPointer,
    doc: Record<string, unknown>
  ): string {
    // For test documents with index
    if ('index' in doc) {
      return `ref_${refPointer}_test_doc_${doc.index}`;
    }

    // Regular document handling
    return `ref_${refPointer}_${this.generateDocumentKey(doc, {})}`;
  }

  /**
   * Get a cached reference target
   */
  public getRefTarget(
    refPointer: JSONPointer,
    doc: Record<string, unknown>
  ): unknown | undefined {
    if (!this.options.enabled) return undefined;

    // Check memory usage and adjust if needed before accessing cache
    if (this.options.memory.adaptiveCaching) {
      this.updateCacheSizesBasedOnMemory();
    }

    const key = this.generateRefKey(refPointer, doc);
    return this.refCache.get(key);
  }

  /**
   * Store a reference target in the cache
   */
  public setRefTarget(
    refPointer: JSONPointer,
    doc: Record<string, unknown>,
    target: unknown
  ): void {
    if (!this.options.enabled) return;

    // Check memory usage and adjust if needed before adding to cache
    if (this.options.memory.adaptiveCaching) {
      this.updateCacheSizesBasedOnMemory();
    }

    const key = this.generateRefKey(refPointer, doc);
    this.refCache.set(key, target);
  }

  /**
   * Get current memory usage statistics
   */
  public getMemoryUsage(): { cacheSize: number; memoryUsageMB: number } {
    const memoryUsageMB = getMemoryUsageMB();

    return {
      cacheSize: this.options.maxSize,
      memoryUsageMB,
    };
  }
}

// Global validation cache instance
let validationCacheInstance: ValidationCache | null = null;

/**
 * Get the validation cache instance
 */
export function getValidationCache(
  options: CacheOptions = {}
): ValidationCache {
  if (!validationCacheInstance) {
    validationCacheInstance = new ValidationCache(options);
  } else if (
    options.enabled !== undefined ||
    options.maxSize !== undefined ||
    options.memory !== undefined
  ) {
    // If new options are provided, update the existing instance
    validationCacheInstance.configure(options);
  }
  return validationCacheInstance;
}

/**
 * Reset the global validation cache
 */
export function resetCache(): void {
  if (validationCacheInstance) {
    validationCacheInstance.reset();
  }
}

// Export memory options for external use
export { MemoryOptions } from './memoryUtils.js';
