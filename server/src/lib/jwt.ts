import jwt, { type SignOptions } from "jsonwebtoken";

const rawSecret = process.env.JWT_SECRET;

if (!rawSecret) {
  // Fail loudly at boot rather than silently signing tokens with `undefined`.
  throw new Error("JWT_SECRET is not set. Add it to server/.env (see .env.example).");
}

// Re-bind to a `string`-typed const: control-flow narrowing from the guard
// above doesn't carry into the function bodies below, since they're
// analyzed independently of the call site.
const JWT_SECRET: string = rawSecret;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as AccessTokenPayload;
}
