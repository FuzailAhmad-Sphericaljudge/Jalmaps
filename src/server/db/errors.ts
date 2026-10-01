import type { PostgrestError } from "@supabase/supabase-js";

export class DatabaseError extends Error {
  readonly code: string;
  readonly details: string;
  readonly hint: string;

  constructor(error: PostgrestError, operation: string) {
    super(`Database operation "${operation}" failed: ${error.message}`);
    this.name = "DatabaseError";
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}

export function requireDatabaseData<T>(
  data: T | null,
  error: PostgrestError | null,
  operation: string,
): T {
  if (error) {
    throw new DatabaseError(error, operation);
  }

  if (data === null) {
    throw new Error(`Database operation "${operation}" returned no data.`);
  }

  return data;
}
