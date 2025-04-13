/**
 * Branded types for stronger type safety
 *
 * A branded type is a TypeScript technique to create nominal typing for primitive types
 * by adding a marker property that exists only at compile time.
 */

/**
 * Generic helper to create a branded type
 */
type Brand<K, T> = K & { __brand: T };

/**
 * OpenAPI version string with type safety
 */
export type OpenAPIVersion = Brand<string, 'OpenAPIVersion'>;

/**
 * JSON pointer for references
 */
export type JSONPointer = Brand<string, 'JSONPointer'>;

/**
 * Path parameter in OpenAPI spec
 */
export type PathParam = Brand<string, 'PathParam'>;

/**
 * URL for API endpoints
 */
export type APIURL = Brand<string, 'APIURL'>;

/**
 * ContentType string with type safety
 */
export type ContentType = Brand<string, 'ContentType'>;

/**
 * Create functions to validate and create branded types
 */

/**
 * Create an OpenAPI version branded type
 * @param version The OpenAPI version string
 * @returns Branded OpenAPIVersion or throws if invalid
 */
export function createOpenAPIVersion(version: string): OpenAPIVersion {
  if (!version.match(/^3\.\d+\.\d+$/) && !version.match(/^3\.\d+$/)) {
    throw new Error(`Invalid OpenAPI version format: ${version}`);
  }
  return version as OpenAPIVersion;
}

/**
 * Create a JSON Pointer branded type
 * @param pointer The JSON pointer string
 * @returns Branded JSONPointer or throws if invalid
 */
export function createJSONPointer(pointer: string): JSONPointer {
  if (!pointer.startsWith('#/') && !pointer.startsWith('/')) {
    throw new Error(`Invalid JSON pointer format: ${pointer}`);
  }
  return pointer as JSONPointer;
}

/**
 * Create a path parameter branded type
 * @param param The path parameter string
 * @returns Branded PathParam
 */
export function createPathParam(param: string): PathParam {
  return param as PathParam;
}

/**
 * Create an API URL branded type
 * @param url The URL string
 * @returns Branded APIURL or throws if invalid
 */
export function createAPIURL(url: string): APIURL {
  try {
    new URL(url);
    return url as APIURL;
  } catch {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

/**
 * Create a ContentType branded type
 * @param contentType The content type string
 * @returns Branded ContentType
 */
export function createContentType(contentType: string): ContentType {
  return contentType as ContentType;
}
