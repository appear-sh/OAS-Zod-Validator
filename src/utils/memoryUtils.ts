/**
 * Memory monitoring utilities
 * These utilities help track memory usage during validation
 */

/**
 * Memory usage stats
 */
export interface MemoryStats {
  /** Heap used before operation in MB */
  heapUsedStart: number;
  /** Heap used after operation in MB */
  heapUsedEnd: number;
  /** Change in heap usage in MB */
  delta: number;
  /** Approximate memory used by a specific operation */
  operationUsage: number;
}

/**
 * Memory optimization configuration
 */
export interface MemoryOptions {
  /** Enable memory tracking (impacts performance slightly) */
  trackMemory?: boolean;
  /** Automatically adjust cache sizes based on memory pressure */
  adaptiveCaching?: boolean;
  /** Maximum memory target in MB (0 = unlimited) */
  maxMemoryTargetMB?: number;
}

/** Default memory options */
export const DEFAULT_MEMORY_OPTIONS: Required<MemoryOptions> = {
  trackMemory: false,
  adaptiveCaching: true,
  maxMemoryTargetMB: 0, // unlimited
};

/**
 * Get memory usage in megabytes
 */
export function getMemoryUsageMB(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const { heapUsed } = process.memoryUsage();
    return Math.round((heapUsed / 1024 / 1024) * 100) / 100;
  }

  // If process.memoryUsage is not available (e.g., browser environments)
  // return a default value
  return 0;
}

/**
 * Run garbage collection if available
 * Note: requires --expose-gc flag
 */
export function runGC(): void {
  // @ts-ignore: global.gc is available when Node.js is run with --expose-gc
  if (typeof global !== 'undefined' && typeof global.gc === 'function') {
    // @ts-ignore
    global.gc();
  }
}

/**
 * Track memory usage for a function
 * @param fn Function to track
 * @param runGCBefore Run garbage collection before measurement
 * @returns Function result and memory stats
 */
export function trackMemoryUsage<T>(
  fn: () => T,
  runGCBefore = false
): { result: T; stats: MemoryStats } {
  // Run GC before if requested
  if (runGCBefore) {
    runGC();
  }

  // Measure memory before
  const heapUsedStart = getMemoryUsageMB();

  // Run the function
  const result = fn();

  // Measure memory after
  const heapUsedEnd = getMemoryUsageMB();
  const delta = Math.max(0, heapUsedEnd - heapUsedStart);

  return {
    result,
    stats: {
      heapUsedStart,
      heapUsedEnd,
      delta,
      operationUsage: delta,
    },
  };
}

/**
 * Calculate adaptive cache size based on memory pressure
 *
 * @param currentSize Current cache size
 * @param memoryUsageMB Current memory usage in MB
 * @param maxMemoryTargetMB Maximum memory target in MB (0 = unlimited)
 * @returns Adjusted cache size
 */
export function getAdaptiveCacheSize(
  currentSize: number,
  memoryUsageMB: number,
  maxMemoryTargetMB = 0
): number {
  // If no memory target, keep the current size
  if (maxMemoryTargetMB <= 0) {
    return currentSize;
  }

  // If memory usage is below 60% of target, keep or increase size
  if (memoryUsageMB < maxMemoryTargetMB * 0.6) {
    return currentSize;
  }

  // If memory usage is between 60-80% of target, keep current size
  if (memoryUsageMB < maxMemoryTargetMB * 0.8) {
    return currentSize;
  }

  // If memory usage is above 80% of target, reduce cache size
  // Calculate reduction factor: 0.8 at 80%, down to 0.5 at 100%
  const reductionFactor = Math.max(0.5, 1 - memoryUsageMB / maxMemoryTargetMB);

  // Reduce cache size, but never below 10
  return Math.max(10, Math.floor(currentSize * reductionFactor));
}
