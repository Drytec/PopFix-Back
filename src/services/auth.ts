import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "sornero-secreto"; 


export function generateToken(payload: object): string {
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: "2h", 
  });
}


export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch {
    throw new Error("Token inválido o expirado");
  }
}
