// Turns an unknown mutation/query error into a safe, displayable string.
//
// Our own API always replies with `{ error: string }` on failure (see
// server/src/middleware/error.middleware.ts). But errors can also come from
// a layer in front of our code — e.g. Vercel returns its own JSON body when
// the serverless function itself fails to invoke:
//   { "error": { "code": "500", "message": "A server error has occurred" } }
// That `error` field is an OBJECT, not a string. Rendering it directly as a
// React child throws "Objects are not valid as a React child" and takes down
// the whole tab. Always resolve to a string here so that can never happen.
export function extractErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } } | undefined)?.response?.data;

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (typeof obj.error === "string") return obj.error;

    if (obj.error && typeof obj.error === "object") {
      const nested = obj.error as Record<string, unknown>;
      if (typeof nested.message === "string") return nested.message;
    }

    if (typeof obj.message === "string") return obj.message;
  }

  // Plain-text platform error pages (e.g. Vercel's FUNCTION_INVOCATION_FAILED
  // page) aren't useful to show verbatim — fall back to the friendly default.
  return fallback;
}
