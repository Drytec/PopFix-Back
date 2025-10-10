import jwt from "jsonwebtoken";

export function generateResetToken(email: string) {
  return jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: "15m" });
}

export function verifyResetToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!);
}
