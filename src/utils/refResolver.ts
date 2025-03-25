import { get } from 'lodash-es';
import { ReferenceError, ErrorCode } from '../errors/index.js';
import { JSONPointer, createJSONPointer } from '../types/index.js';
import { getValidationCache } from './cache.js';
import { memoize } from './memoize.js';

/**
 * Interface for a reference resolution operation
 */
interface RefResolution {
  ref: string;
  jsonPointer: JSONPointer;
  path: string[];
  resolved?: unknown;
  error?: ReferenceError;
}

/**
 * Reference resolver with optimized batch processing and path caching
 */
export class RefResolver {
  private cache = getValidationCache();
  private pendingRefs: Map<string, RefResolution> = new Map();
  private visitedRefs: Set<string> = new Set();
  private doc: Record<string, unknown>;
  private resolvedRefs: string[] = [];
  
  constructor(doc: Record<string, unknown>) {
    this.doc = doc;
  }
  
  /**
   * Collect all references in a document
   */
  public collectRefs(): string[] {
    const refs: string[] = [];
    this._collectRefsRecursive(this.doc, refs);
    return refs;
  }
  
  /**
   * Recursively collect references from an object
   */
  private _collectRefsRecursive(obj: unknown, refs: string[]): void {
    if (!obj || typeof obj !== 'object') return;
    
    if ('$ref' in obj && typeof obj.$ref === 'string') {
      try {
        const ref = obj.$ref;
        // Validate ref format
        createJSONPointer(ref);
        // Store the ref
        refs.push(ref);
      } catch (error) {
        // Always store invalid references to be handled during verification
        const ref = String(obj.$ref);
        if (!refs.includes(ref)) {
          refs.push(ref);
        }
      }
      return; // Stop recursing after finding a ref
    }
    
    Object.values(obj).forEach(value => this._collectRefsRecursive(value, refs));
  }
  
  /**
   * Optimized get path for JSON pointers
   * Memoized for performance
   */
  private getPathForPointer = memoize((jsonPointer: JSONPointer): string[] => {
    return jsonPointer.substring(2).split('/');
  }, { maxSize: 200 });
  
  /**
   * Batch verify all references in the document
   * @returns Array of resolved references
   */
  public verifyAllRefs(): string[] {
    const refs = this.collectRefs();
    
    // Reset resolution tracking
    this.resolvedRefs = [];
    this.visitedRefs.clear();
    
    // First pass - check cache and queue resolution
    for (const ref of refs) {
      // Always throw for invalid references
      if (!ref.startsWith('#/')) {
        throw new ReferenceError(
          ref,
          `Invalid reference format: ${ref}`,
          { code: ErrorCode.INVALID_REFERENCE }
        );
      }
      
      this.queueRefResolution(ref);
    }
    
    // Process all queued references
    this.processQueuedRefs();
    
    return this.resolvedRefs;
  }
  
  /**
   * Queue a reference for resolution
   */
  private queueRefResolution(ref: string): void {
    if (this.visitedRefs.has(ref)) return;
    this.visitedRefs.add(ref);
    
    try {
      const jsonPointer = createJSONPointer(ref);
      const path = this.getPathForPointer(jsonPointer);
      
      // Check if target is already cached
      const cachedTarget = this.cache.getRefTarget(jsonPointer, this.doc);
      if (cachedTarget !== undefined) {
        this.resolvedRefs.push(ref);
        return;
      }
      
      // Queue for resolution
      this.pendingRefs.set(ref, { ref, jsonPointer, path });
    } catch (error) {
      // Throw immediately for invalid reference formats
      throw new ReferenceError(
        ref,
        `Invalid reference format: ${ref}`,
        { code: ErrorCode.INVALID_REFERENCE }
      );
    }
  }
  
  /**
   * Process all queued references in an optimized order
   */
  private processQueuedRefs(): void {
    // Process in batches for better cache locality
    while (this.pendingRefs.size > 0) {
      const currentBatch = new Map(this.pendingRefs);
      this.pendingRefs.clear();
      
      // Resolve all references in the current batch
      for (const [ref, resolution] of currentBatch.entries()) {
        if (resolution.error) {
          throw resolution.error;
        }
        
        try {
          // Resolve the reference target
          const target = get(this.doc, resolution.path);
          
          if (!target) {
            throw new ReferenceError(
              resolution.jsonPointer,
              `Reference not found: ${resolution.jsonPointer}`,
              { code: ErrorCode.REFERENCE_NOT_FOUND }
            );
          }
          
          // Check if this reference contains more refs to process
          if (typeof target === 'object' && target !== null) {
            const nestedRefs: string[] = [];
            this._collectRefsRecursive(target, nestedRefs);
            
            // Queue nested refs
            nestedRefs.forEach(nestedRef => {
              if (!this.visitedRefs.has(nestedRef)) {
                this.queueRefResolution(nestedRef);
              }
            });
          }
          
          // Cache the resolved reference
          this.cache.setRefTarget(resolution.jsonPointer, this.doc, target);
          this.resolvedRefs.push(ref);
        } catch (error) {
          if (error instanceof ReferenceError) {
            throw error;
          }
          throw new ReferenceError(
            ref,
            `Invalid reference: ${ref}`,
            { code: ErrorCode.INVALID_REFERENCE }
          );
        }
      }
    }
  }
}

/**
 * Optimized reference verification function
 * Replaces the original verifyRefTargets with a more efficient implementation
 * 
 * @param doc - The document to check
 * @param refs - Array to collect found references
 */
export function verifyRefTargets(doc: Record<string, unknown>, refs: string[]): void {
  const resolver = new RefResolver(doc);
  const resolvedRefs = resolver.verifyAllRefs();
  
  // Add all resolved refs to the output array
  resolvedRefs.forEach(ref => {
    if (!refs.includes(ref)) {
      refs.push(ref);
    }
  });
} 