import { JSONPointer } from '../types/index.js';
import { encodePointerToken } from './jsonPointer.js';

/**
 * Build a JSON Pointer index for fast O(1) lookups of common component targets.
 * We focus on #/components/** which covers the vast majority of $ref targets in OAS.
 */
export function buildPointerIndex(
  doc: Record<string, unknown>
): Map<JSONPointer, unknown> {
  const index = new Map<JSONPointer, unknown>();
  const components = (doc as any)?.components as
    | Record<string, unknown>
    | undefined;
  if (!components || typeof components !== 'object') return index;

  const sections = [
    'schemas',
    'responses',
    'parameters',
    'examples',
    'requestBodies',
    'headers',
    'securitySchemes',
    'links',
    'callbacks',
    'pathItems',
  ] as const;

  for (const section of sections) {
    const bag = (components as any)[section];
    if (!bag || typeof bag !== 'object') continue;
    for (const [name, value] of Object.entries(
      bag as Record<string, unknown>
    )) {
      // Encode token per RFC6901 (escape '~' and '/') to build valid pointer
      const encodedName = encodePointerToken(name);
      const pointer = `#/components/${section}/${encodedName}` as JSONPointer;
      index.set(pointer, value);
    }
  }

  return index;
}
