export function verifyRefTargets(openapiDoc: Record<string, unknown>, refs: string[]) {
  if (!openapiDoc.components) return;

  // Example: If a reference is "#/components/schemas/User"
  // we check that openapiDoc.components.schemas.User is defined.
  for (const ref of refs) {
    const pathParts = ref.substring(2).split('/'); // remove "#/" and split
    let current: unknown = openapiDoc;
    for (const part of pathParts) {
      if (typeof current !== 'object' || current === null || !(part in current)) {
        throw new Error(`Reference not found: ${ref}`);
      }
      current = (current as Record<string, unknown>)[part];
    }
  }
}
