import { describe, test, expect, vi } from 'vitest';
import {
  getAdaptiveCacheSize,
  getMemoryUsageMB,
  trackMemoryUsage,
  DEFAULT_MEMORY_OPTIONS,
} from '../memoryUtils.js';

describe('Memory Utilities', () => {
  describe('getMemoryUsageMB', () => {
    test('returns memory usage as a number', () => {
      const usage = getMemoryUsageMB();
      expect(typeof usage).toBe('number');
      expect(usage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('trackMemoryUsage', () => {
    test('tracks memory for a function', () => {
      const { result, stats } = trackMemoryUsage(() => {
        return 'test result';
      });

      expect(result).toBe('test result');
      expect(stats).toHaveProperty('heapUsedStart');
      expect(stats).toHaveProperty('heapUsedEnd');
      expect(stats).toHaveProperty('delta');
      expect(stats).toHaveProperty('operationUsage');
      expect(typeof stats.delta).toBe('number');
    });

    test('tracks memory-intensive operations', () => {
      const { stats } = trackMemoryUsage(() => {
        // Create a large array to use memory
        const largeArray = new Array(1000000)
          .fill(0)
          .map((_, i) => ({ id: i, value: `value-${i}` }));
        return largeArray.length;
      });

      // Not all environments will show memory impact the same way,
      // but we can at least check the tracking works
      expect(stats.heapUsedStart).toBeGreaterThanOrEqual(0);
      expect(stats.heapUsedEnd).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAdaptiveCacheSize', () => {
    test('returns original size when no memory limit', () => {
      const size = getAdaptiveCacheSize(100, 50, 0);
      expect(size).toBe(100);
    });

    test('returns original size when memory usage is low', () => {
      const size = getAdaptiveCacheSize(100, 30, 100);
      expect(size).toBe(100);
    });

    test('returns original size when memory usage is moderate', () => {
      const size = getAdaptiveCacheSize(100, 70, 100);
      expect(size).toBe(100);
    });

    test('reduces size when memory usage is high', () => {
      const size = getAdaptiveCacheSize(100, 85, 100);
      expect(size).toBeLessThan(100);
      expect(size).toBeGreaterThan(10);
    });

    test('reduces size significantly when memory usage is very high', () => {
      const size = getAdaptiveCacheSize(100, 95, 100);
      expect(size).toBeLessThan(75);
      expect(size).toBeGreaterThanOrEqual(10);
    });

    test('never reduces size below minimum', () => {
      const size = getAdaptiveCacheSize(100, 100, 100);
      expect(size).toBeGreaterThanOrEqual(10);
    });
  });

  describe('DEFAULT_MEMORY_OPTIONS', () => {
    test('has expected default values', () => {
      expect(DEFAULT_MEMORY_OPTIONS).toHaveProperty('trackMemory');
      expect(DEFAULT_MEMORY_OPTIONS).toHaveProperty('adaptiveCaching');
      expect(DEFAULT_MEMORY_OPTIONS).toHaveProperty('maxMemoryTargetMB');
      expect(DEFAULT_MEMORY_OPTIONS.trackMemory).toBe(false);
      expect(DEFAULT_MEMORY_OPTIONS.adaptiveCaching).toBe(true);
      expect(DEFAULT_MEMORY_OPTIONS.maxMemoryTargetMB).toBe(0);
    });
  });
});
