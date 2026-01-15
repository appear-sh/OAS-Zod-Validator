import type { ZodIssue } from 'zod';

/**
 * Defines the severity level of a validation issue.
 */
export type Severity = 'error' | 'warning';

/**
 * Warning category types
 */
export type WarningCategory =
  | 'documentation'
  | 'security'
  | 'best_practice'
  | 'organization';

/**
 * Interface for defining patterns that identify warnings.
 */
interface WarningPattern {
  pathSuffix: string;
  code: ZodIssue['code'];
  category: WarningCategory;
  suggestion?: string;
}

/**
 * Define patterns that typically represent warnings rather than strict errors.
 * These are for optional but recommended fields and best practices.
 */
const WARNING_PATTERNS: WarningPattern[] = [
  // Documentation patterns
  {
    pathSuffix: '.description',
    code: 'invalid_type',
    category: 'documentation',
    suggestion: 'Add a description to improve API documentation',
  },
  {
    pathSuffix: '.summary',
    code: 'invalid_type',
    category: 'documentation',
    suggestion: 'Add a summary for quick API understanding',
  },
  {
    pathSuffix: '.info.description',
    code: 'invalid_type',
    category: 'documentation',
    suggestion: 'Add an API description in the info object',
  },
  {
    pathSuffix: '.info.contact',
    code: 'invalid_type',
    category: 'documentation',
    suggestion: 'Add contact information for API consumers',
  },
  {
    pathSuffix: '.info.license',
    code: 'invalid_type',
    category: 'documentation',
    suggestion: 'Add license information for your API',
  },
  {
    pathSuffix: '.externalDocs.description',
    code: 'invalid_type',
    category: 'documentation',
    suggestion: 'Add description for external documentation',
  },
  {
    pathSuffix: '.example',
    code: 'invalid_type',
    category: 'documentation',
    suggestion: 'Add example values to improve API documentation',
  },

  // Security patterns
  {
    pathSuffix: '.security',
    code: 'invalid_type',
    category: 'security',
    suggestion: 'Consider adding security requirements to protect your API',
  },
  {
    pathSuffix: '.securitySchemes',
    code: 'invalid_type',
    category: 'security',
    suggestion: 'Define security schemes for API authentication',
  },

  // Best practice patterns
  {
    pathSuffix: '.operationId',
    code: 'invalid_type',
    category: 'best_practice',
    suggestion: 'Add operationId for stable API client generation',
  },
  {
    pathSuffix: '.tags',
    code: 'invalid_type',
    category: 'best_practice',
    suggestion: 'Organize operations with tags for better documentation',
  },
  {
    pathSuffix: '.deprecated',
    code: 'invalid_type',
    category: 'best_practice',
    suggestion: 'Mark deprecated operations appropriately',
  },

  // Organization patterns
  {
    pathSuffix: '.servers',
    code: 'invalid_type',
    category: 'organization',
    suggestion: 'Add server URLs for API environments',
  },
  {
    pathSuffix: '.x-',
    code: 'unrecognized_keys',
    category: 'organization',
    suggestion: 'Custom extensions should use x- prefix',
  },
];

/**
 * Get warning category for a warning pattern
 */
export function getWarningCategory(
  path: string,
  code: string
): WarningCategory | null {
  for (const pattern of WARNING_PATTERNS) {
    if (path.endsWith(pattern.pathSuffix) && code === pattern.code) {
      return pattern.category;
    }
  }
  return null;
}

/**
 * Get suggestion for a warning pattern
 */
export function getWarningSuggestion(
  path: string,
  code: string
): string | undefined {
  for (const pattern of WARNING_PATTERNS) {
    if (path.endsWith(pattern.pathSuffix) && code === pattern.code) {
      return pattern.suggestion;
    }
  }
  return undefined;
}

/**
 * Determines the severity of a ZodIssue based on predefined patterns.
 * Issues matching warning patterns are classified as 'warning', others as 'error'.
 *
 * @param issue - The ZodIssue object.
 * @returns The determined Severity ('error' or 'warning').
 */
export function getIssueSeverity(issue: ZodIssue): Severity {
  const pathString = issue.path.join('.');

  // Check if the issue matches any defined warning pattern
  for (const pattern of WARNING_PATTERNS) {
    if (
      pathString.endsWith(pattern.pathSuffix) &&
      issue.code === pattern.code
    ) {
      return 'warning';
    }
  }

  // Default to 'error' if no warning pattern matches
  return 'error';
}

/**
 * Get all warning patterns (for documentation/testing)
 */
export function getWarningPatterns(): WarningPattern[] {
  return [...WARNING_PATTERNS];
}
