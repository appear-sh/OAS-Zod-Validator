import { JSONPointer } from '../types/index.js';

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
      // JSON Pointer format requires escaping of ~ and / in reference tokens,
      // but component keys are typically clean; keep simple for now.
      const pointer = `#/components/${section}/${name}` as JSONPointer;
      index.set(pointer, value);
    }
  }

  return index;
}
