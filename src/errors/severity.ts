import type { ZodIssue } from 'zod';
import { ZodIssueCode } from 'zod';

/**
 * Defines the severity level of a validation issue.
 */
export type Severity = 'error' | 'warning';

/**
 * Interface for defining patterns that identify warnings.
 */
interface WarningPattern {
  pathSuffix: string;
  code: ZodIssueCode;
  // Optionally add more specific checks, e.g., on expected/received values
  // expected?: any;
}

// Define patterns that typically represent warnings rather than strict errors.
// Initially focusing on missing optional but recommended description/summary fields.
const WARNING_PATTERNS: WarningPattern[] = [
  // Missing description on various elements
  { pathSuffix: '.description', code: ZodIssueCode.invalid_type }, 
  // Missing summary on operations
  { pathSuffix: '.summary', code: ZodIssueCode.invalid_type }, 
  // Add more nuanced patterns here as needed, e.g.:
  // { pathSuffix: '.info.contact', code: ZodIssueCode.invalid_type },
  // { pathSuffix: '.info.license', code: ZodIssueCode.invalid_type },
];

/**
 * Determines the severity of a ZodIssue based on predefined patterns.
 * Issues matching warning patterns are classified as 'warning', others as 'error'.
 * 
 * @param issue - The ZodIssue object.
 * @returns The determined Severity ('error' or 'warning').
 */
export function getIssueSeverity(issue: ZodIssue): Severity {
  const pathString = issue.path.join('.');

  // Check if the issue matches any defined generic warning pattern.
  for (const pattern of WARNING_PATTERNS) {
    if (pathString.endsWith(pattern.pathSuffix) && issue.code === pattern.code) {
       // Add more checks here if necessary, e.g. checking `issue.expected`
       // For now, assume missing description/summary (invalid_type where string expected) is a warning.
       return 'warning';
    }
  }

  // Default to 'error' if no warning pattern matches.
  return 'error';
} 