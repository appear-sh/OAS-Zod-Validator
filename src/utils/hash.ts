/**
 * FNV-1a 32-bit hash for strings. Small, fast, deterministic.
 */
export function fnv1a32(input: string): string {
  let hash = 0x811c9dc5; // offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // 32-bit FNV prime: 16777619
    hash = (hash >>> 0) * 0x01000193;
  }
  // Convert to unsigned hex
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Produce a stable JSON string by sorting object keys recursively.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(',')}}`;
}


