import type { ZodIssue } from 'zod';

/**
 * OpenAPI Specification version types
 */
export type OASVersion =
  | '3.0.0'
  | '3.0.1'
  | '3.0.2'
  | '3.0.3'
  | '3.1.0'
  | '3.1.1'
  | '3.1.2'
  | '3.2.0'
  | '3.2.1'
  | '3.2.2'
  | '3.2.3';

/**
 * Get the base spec URL for a given version
 * Links to Appear's Specs Hub for enhanced UX (AI chat, notes, better navigation)
 * @see https://appear.sh/api-toolkit/specs
 */
function getSpecBaseUrl(version: OASVersion): string {
  if (version.startsWith('3.2.')) {
    return 'https://appear.sh/api-toolkit/specs?openapi=3.2.0#';
  }
  if (version.startsWith('3.1.')) {
    return 'https://appear.sh/api-toolkit/specs?openapi=3.1.0#';
  }
  // 3.0.x
  return 'https://appear.sh/api-toolkit/specs?openapi=3.0.3#';
}

/**
 * A map where keys represent patterns derived from ZodIssue paths
 * (e.g., 'info.title', 'paths./users.get') and values are fragment identifiers
 * for the OpenAPI Specification document.
 */
const specLinkMappings: Record<string, string> = {
  // Top-level fields
  openapi: 'oas-object',
  info: 'info-object',
  servers: 'server-object',
  paths: 'paths-object',
  components: 'components-object',
  security: 'security-requirement-object',
  tags: 'tag-object',
  externalDocs: 'external-documentation-object',

  // Info object fields
  'info.title': 'info-object',
  'info.version': 'info-object',
  'info.summary': 'info-object',
  'info.description': 'info-object',
  'info.termsOfService': 'info-object',
  'info.contact': 'contact-object',
  'info.license': 'license-object',

  // Paths object & Path Item object
  'paths./': 'path-item-object',

  // Operation Object fields
  'paths./.get': 'operation-object',
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

  // Schema Object
  schema: 'schema-object',
  'components.schemas': 'schema-object',
  'components.parameters': 'parameter-object',
  'components.requestBodies': 'request-body-object',
  'components.responses': 'response-object',

  // Additional common mappings
  'components.securitySchemes': 'security-scheme-object',
  'components.examples': 'example-object',
  'components.links': 'link-object',
  'components.callbacks': 'callback-object',
};

/**
 * Tries to find a relevant OpenAPI Specification link based on a ZodIssue.
 *
 * @param issue - The ZodIssue object.
 * @param specVersion - The OpenAPI spec version (defaults to 3.1.0).
 * @returns A URL string pointing to the relevant spec section, or undefined if no match is found.
 */
export function getOASSpecLink(
  issue: ZodIssue,
  specVersion: string = '3.1.0'
): string | undefined {
  const pathString = issue.path.join('.');
  const baseUrl = getSpecBaseUrl(specVersion as OASVersion);

  // Try direct match first
  if (specLinkMappings[pathString]) {
    return baseUrl + specLinkMappings[pathString];
  }

  // Try matching prefixes
  if (pathString.startsWith('info.')) return baseUrl + 'info-object';
  if (pathString.startsWith('servers.')) return baseUrl + 'server-object';
  if (pathString.startsWith('tags.')) return baseUrl + 'tag-object';
  if (pathString.startsWith('externalDocs.'))
    return baseUrl + 'external-documentation-object';

  if (pathString.startsWith('paths.')) {
    const parts = pathString.split('.');
    if (parts.length >= 3 && parts[0] === 'paths') {
      // Check for responses
      const responsesIndex = parts.indexOf('responses');
      if (responsesIndex !== -1 && responsesIndex > 1) {
        if (parts.length > responsesIndex + 1) {
          return baseUrl + 'response-object';
        }
        return baseUrl + 'responses-object';
      }

      // Check for specific fields
      const lastField = parts[parts.length - 1];
      if (lastField === 'schema') return baseUrl + 'schema-object';
      if (lastField === 'parameters') return baseUrl + 'parameter-object';
      if (lastField === 'requestBody') return baseUrl + 'request-body-object';
      if (lastField === 'callbacks') return baseUrl + 'callback-object';
      if (lastField === 'servers') return baseUrl + 'server-object';

      // Check for operations
      const httpMethods = [
        'get',
        'put',
        'post',
        'delete',
        'options',
        'head',
        'patch',
        'trace',
      ];
      if (httpMethods.includes(parts[2])) {
        // Check for operation-specific fields
        const operationFields = [
          'parameters',
          'requestBody',
          'responses',
          'callbacks',
          'security',
          'servers',
        ];
        if (operationFields.includes(parts[3])) {
          if (parts[3] === 'parameters') return baseUrl + 'parameter-object';
          if (parts[3] === 'requestBody')
            return baseUrl + 'request-body-object';
          if (parts[3] === 'responses') return baseUrl + 'responses-object';
          if (parts[3] === 'callbacks') return baseUrl + 'callback-object';
        }
        return baseUrl + 'operation-object';
      }

      return baseUrl + 'path-item-object';
    }
    return baseUrl + 'paths-object';
  }

  if (pathString.startsWith('components.')) {
    const parts = pathString.split('.');
    if (parts.length >= 3) {
      const componentType = parts[1];
      if (componentType === 'schemas') return baseUrl + 'schema-object';
      if (componentType === 'parameters') return baseUrl + 'parameter-object';
      if (componentType === 'requestBodies')
        return baseUrl + 'request-body-object';
      if (componentType === 'responses') return baseUrl + 'response-object';
      if (componentType === 'securitySchemes')
        return baseUrl + 'security-scheme-object';
      if (componentType === 'examples') return baseUrl + 'example-object';
      if (componentType === 'links') return baseUrl + 'link-object';
      if (componentType === 'callbacks') return baseUrl + 'callback-object';
      if (componentType === 'headers') return baseUrl + 'header-object';
    }
    return baseUrl + 'components-object';
  }

  if (pathString.includes('schema') || pathString.includes('schemas')) {
    return baseUrl + 'schema-object';
  }

  if (pathString.includes('security')) {
    if (pathString.startsWith('security.'))
      return baseUrl + 'security-requirement-object';
    return baseUrl + 'security-scheme-object';
  }

  return undefined;
}

/**
 * Get spec link for a specific error code category
 */
export function getSpecLinkForCategory(
  category: string,
  specVersion: string = '3.1.0'
): string | undefined {
  const categoryMappings: Record<string, string> = {
    schema: 'schema-object',
    format: 'data-type-format',
    reference: 'reference-object',
    pattern: 'schema-object',
    numeric: 'schema-object',
    strict: 'validation',
    api_pattern: 'paths-object',
  };

  const section = categoryMappings[category];
  if (section) {
    return getSpecBaseUrl(specVersion as OASVersion) + section;
  }
  return undefined;
}
