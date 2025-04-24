import * as jsonc from 'jsonc-parser';
import * as YAML from 'yaml';
import { Range, Position } from '../types/location.js';

/**
 * Converts a 0-based offset in a string to a 1-based line and column.
 * @param content The full string content.
 * @param offset The 0-based character offset.
 * @returns Position object with 1-based line and column.
 */
function offsetToPosition(content: string, offset: number): Position {
  let line = 1;
  let column = 1; // Start at 1
  // Clamp offset to be within content bounds to avoid errors
  const maxOffset = Math.max(0, Math.min(offset, content.length));

  // Iterate up to the character BEFORE the offset
  for (let i = 0; i < maxOffset; i++) {
    if (content[i] === '\n') {
      line++;
      column = 1; // Reset to 1
    } else {
      column++; // Increment AFTER processing char at i
    }
  }
  // This column is the position *after* the character at maxOffset-1
  // which is the correct 1-based column for the character AT maxOffset
  return { line, column, offset: maxOffset };
}

/**
 * Finds the location (Range) in the original JSON content corresponding to a Zod path.
 * @param content The original JSON string content.
 * @param rootNode The root AST node from jsonc.parseTree.
 * @param path The Zod error path (e.g., ['paths', '/users', 'get', 'description']).
 * @returns The Range object or undefined if the location cannot be determined.
 */
export function getLocationFromJsonAst(
  content: string,
  rootNode: jsonc.Node | undefined,
  path: (string | number)[]
): Range | undefined {
  if (!rootNode || path.length === 0) {
    return undefined;
  }

  try {
    const node = jsonc.findNodeAtLocation(rootNode, path);

    if (node) {
      const start = offsetToPosition(content, node.offset);
      // For end position, use offset + length
      const end = offsetToPosition(content, node.offset + node.length);
      return { start, end };
    }
  } catch (e) {
    // Log error during development? findNodeAtLocation might throw
    console.error(`Error finding JSON node at path ${path.join('.')}: ${e}`);
  }

  return undefined;
}

/**
 * Finds the location (Range) in the original YAML content corresponding to a Zod path.
 * NOTE: This is a basic implementation and might need refinement for complex YAML cases (aliases, etc.).
 * @param content The original YAML string content.
 * @param doc The parsed YAML Document from YAML.parseDocument.
 * @param path The Zod error path (e.g., ['paths', '/users', 'get', 'description']).
 * @returns The Range object or undefined if the location cannot be determined.
 */
export function getLocationFromYamlAst(
  content: string,
  doc: YAML.Document.Parsed | undefined,
  path: (string | number)[]
): Range | undefined {
  if (!doc || path.length === 0) {
    return undefined;
  }

  try {
    const nodeOrValue = doc.getIn(path, true);

    if (
      YAML.isNode(nodeOrValue) &&
      nodeOrValue.range &&
      typeof nodeOrValue.range[0] === 'number' &&
      typeof nodeOrValue.range[1] === 'number'
    ) {
      const [startOffset, endOffset] = nodeOrValue.range;

      const start = offsetToPosition(content, startOffset);
      const end = offsetToPosition(content, endOffset);

      return { start, end };
    }
    // TODO: Handle cases where getIn returns the value, or node has no range.
  } catch (e) {
    console.error(`Error finding YAML node at path ${path.join('.')}: ${e}`);
  }

  return undefined;
}
