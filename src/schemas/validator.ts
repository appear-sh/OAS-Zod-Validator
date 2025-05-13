import { z } from 'zod';
import { OpenAPIObject } from './openapi.js';
import { OpenAPIObject31 } from './openapi31.js';
import { verifyRefTargets } from '../utils/refResolver.js';
import { OpenAPISpec, PathItem, Operation } from './types.js';
import {
  BulkRequestSchema,
  BulkResponseSchema,
  PaginationHeadersSchema,
  PaginationParamsSchema,
} from './api_patterns.js';
import {
  SchemaValidationError,
  StrictValidationError,
  VersionError,
} from '../errors/index.js';
import { OpenAPIVersion, createOpenAPIVersion } from '../types/index.js';
import {
  getValidationCache,
  CacheOptions,
  MemoryOptions,
} from '../utils/cache.js';
import { memoize } from '../utils/memoize.js';
import * as jsonc from 'jsonc-parser';
import * as YAML from 'yaml';
import {
  getLocationFromJsonAst,
  getLocationFromYamlAst,
} from '../utils/locationUtils.js';
import { Range, LocatedZodIssue } from '../types/location.js';
import { get } from 'lodash-es';
import { createJSONPointer, JSONPointer } from '../types/index.js';
import { ParameterObject as ParameterObjectSchema } from './paths.js';
import { ReferenceObject as ReferenceObjectSchema } from './reference.js';

/**
 * Options for validating OpenAPI specifications
 */
export interface ValidationOptions {
  /** Enable strict validation mode with additional checks */
  strict?: boolean;

  /** Allow future OpenAPI versions (beyond those fully supported) */
  allowFutureOASVersions?: boolean;

  /** Strict validation rule configurations */
  strictRules?: {
    /** Require rate limit headers in responses */
    requireRateLimitHeaders?: boolean;
  };

  /** Cache configuration options */
  cache?: CacheOptions;

  /** Memory optimization options - shorthand for cache.memory */
  memory?: MemoryOptions;
}

/**
 * Result of OpenAPI validation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;

  /** Validation errors, if any */
  errors?: z.ZodError;

  /** References that were resolved successfully */
  resolvedRefs: string[];
}

/**
 * Detects the OpenAPI version from a document
 *
 * @param doc - The document to check
 * @returns The OpenAPI version as a branded type
 * @throws {VersionError} If the version is missing or unsupported
 */
function _detectOpenAPIVersion(doc: Record<string, unknown>): OpenAPIVersion {
  if (!doc || typeof doc.openapi !== 'string') {
    throw new VersionError(
      'unknown',
      'Invalid OpenAPI document: missing or invalid openapi version'
    );
  }

  try {
    if (doc.openapi.startsWith('3.1.')) {
      return createOpenAPIVersion(doc.openapi);
    }
    if (doc.openapi.startsWith('3.0.')) {
      return createOpenAPIVersion(doc.openapi);
    }
    throw new VersionError(doc.openapi);
  } catch (error) {
    if (error instanceof VersionError) {
      throw error;
    }
    throw new VersionError(
      typeof doc.openapi === 'string' ? doc.openapi : 'unknown'
    );
  }
}

/**
 * Memoized version of detectOpenAPIVersion
 * For caching, the function uses a custom key function that extracts just the openapi version
 */
const detectOpenAPIVersion = memoize(_detectOpenAPIVersion, {
  maxSize: 50,
  keyFn: (doc) => {
    return doc && typeof doc.openapi === 'string' ? doc.openapi : 'unknown';
  },
});

/**
 * Validates that rate limit headers are present in responses when required
 *
 * @param doc - The OpenAPI document to validate
 * @param options - Validation options
 * @returns ZodError if validation fails, otherwise undefined
 */
function validateRateLimitHeaders(
  doc: OpenAPISpec,
  options: ValidationOptions
): z.ZodError | undefined {
  if (!options.strict || !options.strictRules?.requireRateLimitHeaders) {
    return undefined;
  }

  const issues: z.ZodIssue[] = [];

  const paths = doc.paths || {};
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const [methodKey, operation] of Object.entries(pathItem)) {
      if (!operation || typeof operation !== 'object' || methodKey === '$ref')
        continue;

      const responses = 'responses' in operation ? operation.responses : {};
      for (const [status, response] of Object.entries(responses)) {
        if (!response || typeof response !== 'object') continue;
        if ('$ref' in response) continue;

        const headers =
          'headers' in response
            ? (response.headers as Record<string, unknown>)
            : {};
        const required = [
          'X-RateLimit-Limit',
          'X-RateLimit-Remaining',
          'X-RateLimit-Reset',
        ];
        if (!required.every((header) => header in headers)) {
          issues.push({
            code: z.ZodIssueCode.custom,
            path: ['paths', pathKey, methodKey, 'responses', status, 'headers'],
            message: 'Rate limiting headers are required in strict mode',
          });
        }
      }
    }
  }

  return issues.length ? new z.ZodError(issues) : undefined;
}

/**
 * Creates a customized Zod error map based on validation options
 *
 * @param options - Validation options
 * @returns A Zod error map function
 */
const createErrorMap = (options: ValidationOptions): z.ZodErrorMap => {
  return (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.custom) {
      switch (issue.path[issue.path.length - 1]) {
        case 'headers':
          if (options.strict && options.strictRules?.requireRateLimitHeaders) {
            return { message: issue.message ?? ctx.defaultError };
          }
          return { message: ctx.defaultError };
        default:
          return { message: ctx.defaultError };
      }
    }
    return { message: ctx.defaultError };
  };
};

/**
 * Validates API patterns like bulk operations and pagination
 *
 * @param doc - The OpenAPI document to validate
 * @returns ZodError if validation fails, otherwise undefined
 */
function validateAPIPatterns(doc: OpenAPISpec): z.ZodError | undefined {
  const issues: z.ZodIssue[] = [];

  const paths = doc.paths || {};
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    // Validate bulk operations pattern
    if (pathKey.endsWith('/bulk') && 'post' in pathItem) {
      const operation = (pathItem as PathItem).post as Operation;
      if (!operation?.requestBody?.content?.['application/json']?.schema)
        continue;

      try {
        BulkRequestSchema.parse(
          operation.requestBody.content['application/json'].schema
        );
        if (
          operation.responses?.['200']?.content?.['application/json']?.schema
        ) {
          BulkResponseSchema.parse(
            operation.responses['200'].content['application/json'].schema
          );
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          issues.push(...error.issues);
        }
      }
    }

    // Validate pagination pattern
    if ('get' in pathItem) {
      const operation = (pathItem as PathItem).get as Operation;
      if (!operation?.parameters) continue;

      try {
        const paginationParams = operation.parameters.filter((p) =>
          ['page', 'per_page', 'sort'].includes(p.name)
        );

        if (paginationParams.length > 0) {
          PaginationParamsSchema.parse(
            Object.fromEntries(paginationParams.map((p) => [p.name, p.schema]))
          );

          if (operation.responses?.['200']?.headers) {
            PaginationHeadersSchema.parse(operation.responses['200'].headers);
          }
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          issues.push(...error.issues);
        }
      }
    }
  }

  return issues.length ? new z.ZodError(issues) : undefined;
}

/**
 * Validates an OpenAPI specification document
 *
 * @param document - The OpenAPI document to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateOpenAPI(
  document: unknown,
  options: ValidationOptions = {}
): ValidationResult {
  // Disable caching if we're in test environment
  const testMode = process.env.NODE_ENV === 'test';

  // Merge memory options into cache options if both are provided
  let cacheOptions = options.cache || {};
  if (options.memory) {
    cacheOptions = {
      ...cacheOptions,
      memory: options.memory,
    };
  }

  // Apply test mode settings
  if (testMode) {
    cacheOptions = { ...cacheOptions, enabled: false };
  }

  const cache = getValidationCache(cacheOptions);
  const cacheKey = cache.generateDocumentKey(document, options);

  // Check if we have a cached result
  const cachedResult = cache.getValidationResult(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const resolvedRefs: string[] = [];

  try {
    const docAsObject = document as Record<string, unknown>;
    let parsed: OpenAPISpec;

    const parseParams = {
      path: [],
      errorMap: createErrorMap(options),
      data: {
        strict: options.strict,
        strictRules: options.strictRules,
      },
    };

    if (
      options.allowFutureOASVersions &&
      typeof docAsObject.openapi === 'string' &&
      docAsObject.openapi.startsWith('3.')
    ) {
      parsed = OpenAPIObject31.parse(docAsObject, parseParams);
    } else {
      const version = detectOpenAPIVersion(docAsObject);
      if (version.startsWith('3.1')) {
        parsed = OpenAPIObject31.parse(docAsObject, parseParams);
      } else {
        parsed = OpenAPIObject.parse(docAsObject, parseParams);
      }
    }

    if (options.strict) {
      const allStrictIssues: z.ZodIssue[] = [];

      verifyRefTargets(parsed, resolvedRefs);

      const operationIdIssues = validateOperationIdUniqueness(parsed);
      if (operationIdIssues.length > 0) {
        allStrictIssues.push(...operationIdIssues);
      }

      // Path ambiguity check
      const pathAmbiguityIssues = validatePathAmbiguity(parsed);
      if (pathAmbiguityIssues.length > 0) {
        allStrictIssues.push(...pathAmbiguityIssues);
      }

      // Tag uniqueness check
      const tagUniquenessIssues = validateTagUniqueness(parsed);
      if (tagUniquenessIssues.length > 0) {
        allStrictIssues.push(...tagUniquenessIssues);
      }

      // Iterate through paths and operations for parameter validation
      if (parsed.paths) {
        for (const [pathKey, pathItemValue] of Object.entries(parsed.paths)) {
          if (
            !pathItemValue ||
            typeof pathItemValue !== 'object' ||
            '$ref' in pathItemValue
          ) {
            continue;
          }
          // Assert pathItemValue to a type that is known to include 'parameters' and operation methods.
          // This assumes that if pathItemValue is not a $ref, it conforms to a structure similar to z.infer<typeof PathItemObject from paths.ts>.
          // A more robust solution might involve ensuring PathItem from './types.js' is sufficiently detailed.
          const pathItem = pathItemValue as {
            parameters?: ParameterOrReference[];
            get?: Operation;
            put?: Operation;
            post?: Operation;
            delete?: Operation;
            options?: Operation;
            head?: Operation;
            patch?: Operation;
            trace?: Operation;
            [key: string]: any; // Allow other properties common in PathItemObject
          };

          const methods = [
            'get',
            'put',
            'post',
            'delete',
            'options',
            'head',
            'patch',
            'trace',
          ] as const;
          for (const method of methods) {
            const operation = pathItem[method]; // Operation type is already { parameters?: ... }

            if (operation && typeof operation === 'object') {
              const parameterValIssues = collectAndValidateOperationParameters(
                pathKey,
                method,
                pathItem.parameters as ParameterOrReference[] | undefined,
                operation.parameters as ParameterOrReference[] | undefined,
                parsed // The full document, used by resolveParameter
              );
              if (parameterValIssues.length > 0) {
                allStrictIssues.push(...parameterValIssues);
              }
            }
          }
        }
      }

      const apiPatternsError = validateAPIPatterns(parsed);
      if (apiPatternsError) {
        allStrictIssues.push(...apiPatternsError.issues);
      }

      if (options.strictRules?.requireRateLimitHeaders) {
        const rateLimitError = validateRateLimitHeaders(parsed, options);
        if (rateLimitError) {
          allStrictIssues.push(...rateLimitError.issues);
        }
      }

      if (allStrictIssues.length > 0) {
        throw new SchemaValidationError(
          'Strict OpenAPI validation failed.',
          new z.ZodError(allStrictIssues),
          { context: { strict: true } }
        );
      }
    }

    const result = { valid: true, resolvedRefs };

    // Don't store in cache if in test mode to avoid test interference
    if (!testMode) {
      cache.setValidationResult(cacheKey, result);
    }

    return result;
  } catch (error) {
    let result: ValidationResult;

    if (error instanceof z.ZodError) {
      result = {
        valid: false,
        errors: error,
        resolvedRefs,
      };
    } else if (error instanceof SchemaValidationError) {
      result = {
        valid: false,
        errors: error.zodError,
        resolvedRefs,
      };
    } else if (error instanceof StrictValidationError) {
      // Attempt to preserve original ZodError if wrapped, otherwise create custom
      const originalError =
        error.cause instanceof z.ZodError ? error.cause : undefined;
      result = {
        valid: false,
        errors:
          originalError ??
          new z.ZodError([
            {
              code: z.ZodIssueCode.custom,
              path: [], // Removed error.path as it doesn't exist
              message: error.message,
            },
          ]),
        resolvedRefs,
      };
    } else {
      result = {
        valid: false,
        errors: new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            path: [],
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ]),
        resolvedRefs,
      };
    }

    // Don't store in cache if in test mode to avoid test interference
    if (!testMode) {
      cache.setValidationResult(cacheKey, result);
    }

    return result;
  }
}

/**
 * Result of OpenAPI validation with potentially located issues.
 */
export interface LocatedValidationResult
  extends Omit<ValidationResult, 'errors'> {
  errors?: z.ZodError<LocatedZodIssue>;
}

/**
 * Validates an OpenAPI specification document provided as a string.
 * Automatically detects JSON or YAML and provides line/column numbers for errors.
 *
 * @param content - The OpenAPI document content as a string.
 * @param options - Validation options.
 * @returns Validation result with located errors.
 */
export function validateOpenAPIDocument(
  content: string,
  options: ValidationOptions = {}
): LocatedValidationResult {
  let parsedContent: unknown;
  let fileType: 'json' | 'yaml';
  let rootNode: jsonc.Node | undefined;
  let yamlDoc: YAML.Document.Parsed | undefined;
  const parseErrors: jsonc.ParseError[] = [];

  // Try parsing as JSON first
  try {
    // Use parseTree to get AST for location mapping
    rootNode = jsonc.parseTree(content, parseErrors);
    if (parseErrors.length > 0) {
      // Check if errors are actual structural errors or just comments
      const structuralErrors = parseErrors.filter(
        (e) => e.error !== jsonc.ParseErrorCode.InvalidCommentToken
      );
      if (structuralErrors.length > 0) {
        throw new Error(`JSON parsing failed: ${structuralErrors[0].error}`);
      }
      // If only non-structural errors, proceed but maybe warn?
    }
    // Use regular parse for the object Zod will validate
    // Allow trailing commas as jsonc handles them
    parsedContent = jsonc.parse(content, [], { allowTrailingComma: true });
    fileType = 'json';
  } catch /* No variable needed */ {
    // If JSON parsing fails, try YAML
    try {
      yamlDoc = YAML.parseDocument(content, { strict: false }); // Use non-strict mode potentially?
      if (yamlDoc.errors.length > 0) {
        // Simplify: Report only the first YAML parse error message
        return {
          valid: false,
          errors: new z.ZodError([
            {
              code: z.ZodIssueCode.custom,
              path: [],
              message: `YAML parsing failed: ${yamlDoc.errors[0].message}`,
            },
          ]),
          resolvedRefs: [],
        };
      }
      parsedContent = yamlDoc.toJS();
      fileType = 'yaml';
    } catch (yamlError) {
      // If both fail, return a generic parsing error
      return {
        valid: false,
        errors: new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            path: [],
            message:
              yamlError instanceof Error
                ? `Failed to parse as JSON or YAML: ${yamlError.message}`
                : 'Failed to parse as JSON or YAML',
          },
        ]),
        resolvedRefs: [],
      };
    }
  }

  // Now validate the parsed content using the existing function
  const validationResult = validateOpenAPI(parsedContent, options);

  // If validation failed, augment errors with location
  if (!validationResult.valid && validationResult.errors) {
    const locatedIssues: LocatedZodIssue[] = validationResult.errors.issues.map(
      (issue) => {
        let range: Range | undefined;
        try {
          if (fileType === 'json' && rootNode) {
            range = getLocationFromJsonAst(content, rootNode, issue.path);
          } else if (fileType === 'yaml' && yamlDoc) {
            range = getLocationFromYamlAst(content, yamlDoc, issue.path);
          }
        } catch (locationError) {
          // Log location finding errors during development?
          console.error(
            `Error getting location for path ${issue.path.join('.')}:`,
            locationError
          );
        }

        // Create new issue object with range
        const locatedIssue: LocatedZodIssue = { ...issue };
        if (range) {
          locatedIssue.range = range;
        }
        return locatedIssue;
      }
    );

    // Return result with located issues
    return {
      valid: false,
      // Create a new ZodError instance with the augmented issues
      errors: new z.ZodError(locatedIssues),
      resolvedRefs: validationResult.resolvedRefs,
    };
  }

  // If validation passed or no errors, return the original result
  // (We need to cast the errors type even if undefined/empty for return type)
  return validationResult as LocatedValidationResult;
}

/**
 * Validates that all operationIds within the document are unique.
 * @param doc The OpenAPI document to validate.
 * @returns An array of ZodIssue objects if duplicates are found, otherwise an empty array.
 */
function validateOperationIdUniqueness(doc: OpenAPISpec): z.ZodIssue[] {
  const issues: z.ZodIssue[] = [];
  const encounteredOperationIds = new Set<string>();

  if (doc.paths) {
    for (const [pathKey, pathItemValue] of Object.entries(doc.paths)) {
      // Ensure pathItemValue is an object and not a reference before proceeding
      if (
        !pathItemValue ||
        typeof pathItemValue !== 'object' ||
        '$ref' in pathItemValue
      ) {
        continue;
      }
      const pathItem = pathItemValue as Omit<PathItem, '$ref'>; // Type assertion after check

      const methods = [
        'get',
        'put',
        'post',
        'delete',
        'options',
        'head',
        'patch',
        'trace',
      ] as const;

      for (const method of methods) {
        const operation = pathItem[method];

        if (
          operation &&
          typeof operation === 'object' &&
          'operationId' in operation &&
          typeof operation.operationId === 'string' &&
          operation.operationId
        ) {
          if (encounteredOperationIds.has(operation.operationId)) {
            issues.push({
              code: z.ZodIssueCode.custom,
              path: ['paths', pathKey, method, 'operationId'],
              message: `Duplicate operationId '${operation.operationId}' found. operationId MUST be unique across all operations.`,
            });
          } else {
            encounteredOperationIds.add(operation.operationId);
          }
        }
      }
    }
  }
  return issues;
}

// Type for a fully resolved Parameter object (no $ref)
// This infers the type from the Zod schema, excluding the possibility of it being a reference itself.
// We assume ParameterObjectSchema does not include `$ref` at its top level after specific discriminated union parsing.
type ResolvedParameter = z.infer<typeof ParameterObjectSchema>;

// Type for an item in a parameters array, which can be a ParameterObject or a ReferenceObject
const _ParameterOrReferenceSchema = z.union([
  ParameterObjectSchema,
  ReferenceObjectSchema,
]);

type ParameterOrReference = z.infer<typeof _ParameterOrReferenceSchema>;

/**
 * Checks a list of RESOLVED parameters for uniqueness based on 'name' and 'in'.
 * @param resolvedParameters - Array of fully resolved parameter objects.
 * @param baseErrorPath - The base path for constructing ZodIssue paths (e.g., ['paths', pathKey, 'parameters'] or ['paths', pathKey, method, 'parameters']).
 * @returns An array of ZodIssue objects for any duplicates found.
 */
function checkResolvedParameterListUniqueness(
  resolvedParameters: ReadonlyArray<ResolvedParameter>,
  baseErrorPath: (string | number)[]
): z.ZodIssue[] {
  const issues: z.ZodIssue[] = [];
  const seenParameters = new Set<string>();

  for (let i = 0; i < resolvedParameters.length; i++) {
    const param = resolvedParameters[i];
    // Ensure param is a resolved object and has 'name' and 'in' properties
    if (
      typeof param === 'object' &&
      param !== null &&
      'name' in param &&
      typeof param.name === 'string' &&
      'in' in param &&
      typeof param.in === 'string'
    ) {
      const key = `${param.in}:${param.name}`;
      if (seenParameters.has(key)) {
        issues.push({
          code: z.ZodIssueCode.custom,
          path: [...baseErrorPath, i],
          message: `Duplicate parameter found: name '${param.name}' in '${param.in}'. Parameters must be unique by name and location.`,
        });
      } else {
        seenParameters.add(key);
      }
    } else {
      // This case should ideally not be reached if inputs are correctly resolved parameters.
      // Log or handle malformed resolved parameter object if necessary.
      issues.push({
        code: z.ZodIssueCode.custom,
        path: [...baseErrorPath, i],
        message:
          'Encountered an invalid or unresolved parameter object during uniqueness check.',
      });
    }
  }
  return issues;
}

/**
 * (Placeholder for orchestration logic)
 * Collects, resolves, and validates parameters for a single operation,
 * checking for uniqueness within path item parameters, operation parameters,
 * and applying override logic.
 *
 * @param pathKey - Key of the path.
 * @param method - HTTP method.
 * @param rawPathItemParams - Raw parameters from PathItem.
 * @param rawOperationParams - Raw parameters from Operation.
 * @param document - The full OpenAPI document for resolving references.
 * @param basePathForIssues - Base path for constructing ZodIssue paths.
 * @returns An array of ZodIssue objects.
 */
function collectAndValidateOperationParameters(
  pathKey: string,
  method: string,
  rawPathItemParams: ReadonlyArray<ParameterOrReference> | undefined,
  rawOperationParams: ReadonlyArray<ParameterOrReference> | undefined,
  document: OpenAPISpec
): z.ZodIssue[] {
  let allIssues: z.ZodIssue[] = [];
  const cache = getValidationCache();

  const resolveParameter = (
    paramOrRef: ParameterOrReference,
    doc: OpenAPISpec
  ): ResolvedParameter | null => {
    if (!('$ref' in paramOrRef)) {
      // It's already a ParameterObject, ensure it fits our ResolvedParameter type definition
      // ParameterObjectSchema.parse(paramOrRef); // This would throw if invalid, which is good
      return paramOrRef as ResolvedParameter; // Assuming it's already valid if not a ref
    }

    const refString = paramOrRef.$ref;
    let jsonPointer: JSONPointer;
    try {
      jsonPointer = createJSONPointer(refString);
    } catch {
      // Invalid reference format, issue should be caught by verifyRefTargets or schema validation
      return null;
    }

    // Check cache first
    const cachedTarget = cache.getRefTarget(jsonPointer, doc);
    if (cachedTarget !== undefined) {
      try {
        // Validate that the cached target is a valid ParameterObject
        ParameterObjectSchema.parse(cachedTarget);
        return cachedTarget as ResolvedParameter;
      } catch {
        // Cached item is not a valid parameter object
        return null;
      }
    }

    // If not in cache, resolve using lodash.get
    const path = jsonPointer.substring(2).split('/');
    const target = get(doc, path);

    if (!target) {
      // Reference not found, issue should be caught by verifyRefTargets
      return null;
    }

    try {
      // Validate that the resolved target is a valid ParameterObject
      ParameterObjectSchema.parse(target);
      // Cache the successfully resolved and validated parameter object
      cache.setRefTarget(jsonPointer, doc, target);
      return target as ResolvedParameter;
    } catch {
      // Resolved item is not a valid parameter object
      return null;
    }
  };

  const resolvedPathItemParams: ResolvedParameter[] = [];
  if (rawPathItemParams) {
    for (const p of rawPathItemParams) {
      const resolved = resolveParameter(p, document);
      if (resolved) resolvedPathItemParams.push(resolved);
      // If resolveParameter returns null, an issue should have been created elsewhere (e.g. verifyRefTargets)
      // or the structure is invalid and caught by main schema parsing.
    }
  }

  allIssues = allIssues.concat(
    checkResolvedParameterListUniqueness(resolvedPathItemParams, [
      'paths',
      pathKey,
      'parameters',
    ])
  );

  const resolvedOperationParams: ResolvedParameter[] = [];
  if (rawOperationParams) {
    for (const p of rawOperationParams) {
      const resolved = resolveParameter(p, document);
      if (resolved) resolvedOperationParams.push(resolved);
    }
  }
  allIssues = allIssues.concat(
    checkResolvedParameterListUniqueness(resolvedOperationParams, [
      'paths',
      pathKey,
      method,
      'parameters',
    ])
  );

  // If no internal duplication issues found in the *resolved* lists,
  // then the override logic can be applied.
  if (allIssues.length === 0) {
    const effectiveParametersMap = new Map<string, ResolvedParameter>();
    resolvedPathItemParams.forEach((p) =>
      effectiveParametersMap.set(`${p.in}:${p.name}`, p)
    );
    resolvedOperationParams.forEach((p) =>
      effectiveParametersMap.set(`${p.in}:${p.name}`, p)
    ); // Override logic

    // The `effectiveParametersMap.values()` now represents the final unique list.
    // No further duplication check is needed on this merged list itself due to:
    // 1. `checkResolvedParameterListUniqueness` ensuring inputs are clean.
    // 2. Map construction inherently ensuring unique keys (in:name).
  }

  return allIssues;
}

/**
 * Validates that path templates are not ambiguous.
 * Two path templates are ambiguous if they are structurally equivalent, e.g.,
 * /pets/{petId} and /pets/{name} are ambiguous.
 * @param doc The OpenAPI document to validate.
 * @returns An array of ZodIssue objects if ambiguities are found, otherwise an empty array.
 */
function validatePathAmbiguity(doc: OpenAPISpec): z.ZodIssue[] {
  const issues: z.ZodIssue[] = [];
  if (!doc.paths) {
    return issues;
  }

  const pathKeys = Object.keys(doc.paths);
  const normalizedPathMap = new Map<string, string[]>(); // Maps normalized path to list of original paths

  const normalizePath = (pathKey: string): string => {
    return pathKey.replace(/\{[^/{}]+\}/g, '{#PARAM#}');
  };

  for (const pathKey of pathKeys) {
    const normalized = normalizePath(pathKey);
    if (!normalizedPathMap.has(normalized)) {
      normalizedPathMap.set(normalized, []);
    }
    normalizedPathMap.get(normalized)!.push(pathKey);
  }

  for (const [normalized, originalPaths] of normalizedPathMap.entries()) {
    if (originalPaths.length > 1) {
      // Found ambiguous paths
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['paths'], // General path for this type of document-wide issue
        message: `Ambiguous path templates found. The following paths are structurally equivalent: ${originalPaths.join(', ')}. Normalized form: ${normalized}`,
      });
      // Optionally, create an issue for each specific conflicting path as well,
      // though a single issue listing all conflicts for a given normalized form is often sufficient.
      // For example:
      // originalPaths.forEach(op => {
      //   issues.push({
      //     code: z.ZodIssueCode.custom,
      //     path: ['paths', op],
      //     message: `Path template is ambiguous with other paths (e.g., ${originalPaths.filter(p => p !== op)[0]}). Normalized form: ${normalized}`
      //   });
      // });
    }
  }

  return issues;
}

/**
 * Validates that all tag names in the global tags array are unique.
 * Tag names MUST be unique according to the OpenAPI specification.
 * @param doc The OpenAPI document to validate.
 * @returns An array of ZodIssue objects if duplicate tag names are found, otherwise an empty array.
 */
function validateTagUniqueness(doc: OpenAPISpec): z.ZodIssue[] {
  const issues: z.ZodIssue[] = [];
  if (!doc.tags || !Array.isArray(doc.tags)) {
    return issues;
  }

  const encounteredTagNames = new Set<string>();
  for (let i = 0; i < doc.tags.length; i++) {
    const tagObject = doc.tags[i];
    if (
      typeof tagObject === 'object' &&
      tagObject !== null &&
      typeof tagObject.name === 'string'
    ) {
      const tagName = tagObject.name;
      if (encounteredTagNames.has(tagName)) {
        issues.push({
          code: z.ZodIssueCode.custom,
          path: ['tags', i, 'name'], // Path to the duplicate tag's name
          message: `Duplicate tag name found: "${tagName}". Tag names MUST be unique.`,
        });
      } else {
        encounteredTagNames.add(tagName);
      }
    } else {
      // This would typically be caught by the main schema validation for the TagObject structure
      // but including a check here for robustness in case doc.tags contains non-objects or invalid tags.
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['tags', i],
        message: 'Invalid tag object found in global tags array.',
      });
    }
  }
  return issues;
}
