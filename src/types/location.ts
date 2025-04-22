/**
 * Represents a 1-based line and column position in a source file.
 */
export interface Position {
  line: number; // 1-based line number
  column: number; // 1-based column number
  offset: number; // 0-based character offset
}

/**
 * Represents a start and end position range in a source file.
 */
export interface Range {
  start: Position;
  end: Position;
} 