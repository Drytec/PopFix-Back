import { Request, Response } from "express";
import { getUserByEmail } from "../services/user";
import { generateResetToken, verifyResetToken } from "../middlewares/auth";
import { sendResetPasswordEmail } from "../services/resetPass";
import bcrypt from "bcryptjs";
import { supabase } from "../config/database";

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const token = generateResetToken(email);
    await sendResetPasswordEmail(email, token);

    return res.json({ message: "Correo de recuperación enviado" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    // Validaciones de seguridad para nueva contraseña
    const pwdStr =
      typeof newPassword === "string"
        ? newPassword
        : typeof newPassword === "number"
        ? String(newPassword)
        : null;
    
    if (!pwdStr || pwdStr.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    // Prevenir contraseñas comunes y patrones de SQL injection
    const forbiddenPatterns = [
      /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b)/i, // SQL keywords
      /(\bUNION\b|\bOR\b.*=.*\b|\bAND\b.*=.*\b)/i, // SQL injection patterns
      /['"`;\\]/g, // Caracteres peligrosos
      /^\s+$/ // Solo espacios en blanco
    ];

    const hasForbiddenPattern = forbiddenPatterns.some(pattern => pattern.test(pwdStr));
    if (hasForbiddenPattern) {
      return res.status(400).json({ 
        error: "La contraseña contiene caracteres o patrones no permitidos" 
      });
    }

    // Validar que tenga al menos una letra y un número para mayor seguridad
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(pwdStr)) {
      return res.status(400).json({ 
        error: "La contraseña debe contener al menos una letra y un número" 
      });
    }

    const decoded = verifyResetToken(token) as { email: string };
    const hashedPassword = await bcrypt.hash(pwdStr, 10);

    const { error } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("email", decoded.email);

    if (error) throw new Error(error.message);

    return res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error: any) {
    return res.status(400).json({ error: "Token inválido o expirado" });
  }
}
