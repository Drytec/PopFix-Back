import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "sornero-secreto";

/**
 * Generates a JSON Web Token (JWT) with a given payload.
 *
 * The token is signed using the secret key defined in the environment variable
 * `JWT_SECRET`, or a default fallback if not provided. The generated token
 * expires in 2 hours by default.
 *
 * @function generateToken
 * @param {object} payload - The data to encode inside the token (e.g., user information).
 * @returns {string} The generated JWT as a string.
 *
 * @example
 * const token = generateToken({ userId: "123", role: "admin" });
 * console.log(token); // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
export function generateToken(payload: object): string {
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: "2h",
  });
}

/**
 * Verifies and decodes a JSON Web Token (JWT).
 *
 * This function validates the provided token using the secret key. If valid,
 * it returns the decoded payload. If invalid or expired, it throws an error.
 *
 * @function verifyToken
 * @param {string} token - The JWT to verify and decode.
 * @returns {object | string} The decoded payload of the token.
 * @throws {Error} If the token is invalid or expired.
 *
 * @example
 * try {
 *   const decoded = verifyToken(token);
 *   console.log(decoded.userId); // "123"
 * } catch (err) {
 *   console.error("Invalid token:", err.message);
 * }
 */
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch {
    throw new Error("Token inválido o expirado");
  }
}
