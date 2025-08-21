import { JSONPointer } from '../types/index.js';

/**
 * Encode a single JSON Pointer token per RFC 6901
 * ~ -> ~0, / -> ~1
 */
export function encodePointerToken(token: string): string {
  return token.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Decode a single JSON Pointer token per RFC 6901
 * ~1 -> /, ~0 -> ~
 */
export function decodePointerToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * Split a JSON Pointer into decoded tokens. Accepts pointers that start with
 * "#/" (common in OAS) or "/" (RFC form). Empty pointer returns an empty array.
 */
export function splitPointer(pointer: JSONPointer | string): string[] {
  const p = String(pointer);
  // Remove optional leading '#'
  const base = p.startsWith('#') ? p.slice(1) : p;
  if (base === '' || base === '/') return [];
  if (!base.startsWith('/')) return [];
  // Split and decode tokens
  return base
    .substring(1)
    .split('/')
    .map((t) => decodePointerToken(t));
}

/**
 * Join tokens into a JSON Pointer string with a leading '#/' and encoded tokens.
 */
export function joinPointerTokens(tokens: string[]): JSONPointer {
  const encoded = tokens.map((t) => encodePointerToken(String(t))).join('/');
  return `#/${encoded}` as unknown as JSONPointer;
}

/**
 * Walk a document by JSON Pointer and return the target value.
 * - Decodes tokens
 * - Supports array indices when the current value is an array and token is a non-negative integer
 */
export function getByPointer(
  doc: unknown,
  pointer: JSONPointer | string
): unknown {
  const tokens = splitPointer(pointer);
  let current: any = doc;
  for (const token of tokens) {
    if (current == null) return undefined;
    if (Array.isArray(current)) {
      if (/^\d+$/.test(token)) {
        const index = Number(token);
        current = current[index];
        continue;
      }
      // Non-numeric token on array is undefined
      return undefined;
    }
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[token];
  }
  return current;
}
