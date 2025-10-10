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

    const decoded = verifyResetToken(token) as { email: string };
    const hashedPassword = await bcrypt.hash(newPassword, 10);

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
