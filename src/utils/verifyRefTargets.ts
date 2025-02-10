import { get } from 'lodash-es';

export function verifyRefTargets(doc: Record<string, unknown>, refs: string[]): void {
  const collectRefs = (obj: unknown): void => {
    if (!obj || typeof obj !== 'object') return;
    
    if ('$ref' in obj && typeof obj.$ref === 'string') {
      refs.push(obj.$ref);
      return; // Stop recursing after finding a ref
    }
    
    Object.values(obj).forEach(collectRefs);
  };

  // First collect all refs
  collectRefs(doc);

  // Then verify each ref exists
  refs.forEach(ref => {
    const path = ref.substring(2).split('/');
    const target = get(doc, path);
    
    if (!target) {
      throw new Error(`Reference not found: ${ref}`);
    }
  });
}
