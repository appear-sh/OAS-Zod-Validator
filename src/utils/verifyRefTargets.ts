import { get } from 'lodash-es';
import { ReferenceError, ErrorCode } from '../errors/index.js';
import { createJSONPointer } from '../types/index.js';
import { getValidationCache } from './cache.js';

/**
 * Verifies that all references in a document point to valid targets
 *
 * @param doc - The document to check
 * @param refs - Array to collect found references as strings
 * @throws {ReferenceError} If a reference is invalid or not found
 */
export function verifyRefTargets(
  doc: Record<string, unknown>,
  refs: string[]
): void {
  const cache = getValidationCache();

  /**
   * Recursively collects all references in an object
   *
   * @param obj - The object to check for references
   */
  const collectRefs = (obj: unknown): void => {
    if (!obj || typeof obj !== 'object') return;

    if ('$ref' in obj && typeof obj.$ref === 'string') {
      try {
        // Validate ref format
        createJSONPointer(obj.$ref);
        // Store the string value in the refs array passed in by the caller
        refs.push(obj.$ref);
      } catch {
        throw new ReferenceError(
          String(obj.$ref),
          `Invalid reference format: ${obj.$ref}`,
          { code: ErrorCode.INVALID_REFERENCE }
        );
      }
      return; // Stop recursing after finding a ref
    }

    Object.values(obj).forEach(collectRefs);
  };

  // First collect all refs
  collectRefs(doc);

  // Then verify each ref exists
  refs.forEach((ref) => {
    try {
      // Validate the format again to ensure type safety
      const _refPointer = createJSONPointer(ref);

      // Check if we have this reference target cached
      const cachedTarget = cache.getRefTarget(_refPointer, doc);
      if (cachedTarget !== undefined) {
        return; // Reference exists in cache
      }

      const path = _refPointer.substring(2).split('/');
      const target = get(doc, path);

      if (!target) {
        throw new ReferenceError(
          _refPointer,
          `Reference not found: ${_refPointer}`,
          { code: ErrorCode.REFERENCE_NOT_FOUND }
        );
      }

      // Cache the target for future reference lookups
      cache.setRefTarget(_refPointer, doc, target);
    } catch (error) {
      if (error instanceof ReferenceError) {
        throw error;
      }
      throw new ReferenceError(ref, `Invalid reference: ${ref}`, {
        code: ErrorCode.INVALID_REFERENCE,
      });
    }
  });
}
