import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export function generateResetToken(email: string) {
  return jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: "15m" });
}

export function verifyResetToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!);
}

// Middleware de autenticación para rutas protegidas
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No autorizado - Token faltante" });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Poner el usuario decodificado en req.user
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };
    
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
