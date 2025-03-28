import type { ZodIssue } from 'zod';

// Using OAS 3.1 links, adjust if specific version support needs differentiation later.
const OAS_SPEC_BASE_URL = 'https://spec.openapis.org/oas/v3.1.0#';

/**
 * A map where keys represent patterns derived from ZodIssue paths 
 * (e.g., 'info.title', 'paths./users.get') and values are fragment identifiers 
 * for the OpenAPI Specification document.
 */
const specLinkMappings: Record<string, string> = {
  // Top-level fields
  'openapi': 'oas-object',
  'info': 'info-object',
  'servers': 'server-object',
  'paths': 'paths-object',
  'components': 'components-object',
  'security': 'security-requirement-object',
  'tags': 'tag-object',
  'externalDocs': 'external-documentation-object',

  // Info object fields
  'info.title': 'info-object',
  'info.version': 'info-object',
  'info.summary': 'info-object',
  'info.description': 'info-object',
  'info.termsOfService': 'info-object',
  'info.contact': 'contact-object',
  'info.license': 'license-object',

  // Paths object & Path Item object
  // More specific path items might be needed, e.g., matching regex for path names
  'paths./': 'path-item-object', // Placeholder for any path

  // Operation Object fields
  'paths./.get': 'operation-object', // Placeholder for any GET operation
  'paths./.put': 'operation-object',
  'paths./.post': 'operation-object',
  'paths./.delete': 'operation-object',
  'paths./.options': 'operation-object',
  'paths./.head': 'operation-object',
  'paths./.patch': 'operation-object',
  'paths./.trace': 'operation-object',
  'paths./.parameters': 'parameter-object',
  'paths./.requestBody': 'request-body-object',
  'paths./.responses': 'responses-object',
  'paths./.callbacks': 'callback-object',
  'paths./.tags': 'operation-object',
  'paths./.summary': 'operation-object',
  'paths./.operationId': 'operation-object',

  // Parameter Object fields
  'paths./.parameters.name': 'parameter-object',
  'paths./.parameters.in': 'parameter-object',
  'paths./.parameters.schema': 'schema-object',
  
  // Schema Object (very common, might need refinement)
  'schema': 'schema-object', // Generic fallback
  'components.schemas': 'schema-object',
  'components.parameters': 'parameter-object',
  'components.requestBodies': 'request-body-object',
  'components.responses': 'response-object',

  // Add more specific mappings as needed based on common Zod errors
};

/**
 * Tries to find a relevant OpenAPI Specification link based on a ZodIssue.
 * 
 * @param issue - The ZodIssue object.
 * @returns A URL string pointing to the relevant spec section, or undefined if no match is found.
 */
export function getOASSpecLink(issue: ZodIssue): string | undefined {
  const pathString = issue.path.join('.');
  
  // Try direct match first
  if (specLinkMappings[pathString]) {
    return OAS_SPEC_BASE_URL + specLinkMappings[pathString];
  }

  // Try matching prefixes (e.g., 'info.contact.name' should map to 'contact-object')
  // This requires iterating or a more complex matching structure, keeping it simple for now.
  // Example simplistic prefix matching:
  if (pathString.startsWith('info.')) return OAS_SPEC_BASE_URL + 'info-object';
  if (pathString.startsWith('paths.')) {
    // Very basic heuristic, could be improved
    const parts = pathString.split('.');
    if (parts.length >= 3 && parts[0] === 'paths') {
      // Check for path segments *after* the path template (parts[1])
      
      // Is it within the responses part of an operation?
      const responsesIndex = parts.indexOf('responses');
      if (responsesIndex !== -1 && responsesIndex > 1) { // Ensure 'responses' appears after the path template
        // If the error path goes deeper than just 'responses' (e.g., into a specific code like '204')
        if (parts.length > responsesIndex + 1) {
           return OAS_SPEC_BASE_URL + 'response-object'; // Error within a specific Response Object
        }
        return OAS_SPEC_BASE_URL + 'responses-object'; // Error at the Responses Object level
      }
      
      if(parts[parts.length -1] === 'schema') return OAS_SPEC_BASE_URL + 'schema-object';
      if(parts[parts.length -1] === 'parameters') return OAS_SPEC_BASE_URL + 'parameter-object';
      if(parts[parts.length -1] === 'requestBody') return OAS_SPEC_BASE_URL + 'request-body-object';
      // Don't link to responses-object here anymore, handled above
      
      // Check if it looks like an operation (and not handled by responses check above)
      if (['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(parts[2])){
         return OAS_SPEC_BASE_URL + 'operation-object';
      }
      return OAS_SPEC_BASE_URL + 'path-item-object';
    }
     return OAS_SPEC_BASE_URL + 'paths-object';
  }
  if (pathString.startsWith('components.')) return OAS_SPEC_BASE_URL + 'components-object';
  if (pathString.includes('schema') || pathString.includes('schemas')) return OAS_SPEC_BASE_URL + 'schema-object'; // Broad fallback
  
  // Add more sophisticated matching logic here if needed

  return undefined;
} 