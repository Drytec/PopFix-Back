import { Request, Response } from "express";
import { getUserByEmail } from "../services/user";
import { generateResetToken, verifyResetToken } from "../middlewares/auth";
import { sendResetPasswordEmail } from "../services/resetPass";
import bcrypt from "bcryptjs";
import { supabase } from "../config/database";

/**
 * Sends a password reset email to the user.
 * @async
 * @function forgotPassword
 * @param {Request} req - Express request object containing the user's email in the body.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} - Returns a success message if the reset email was sent successfully.
 * 
 * @description
 * This function:
 * 1. Checks if the user exists by email.
 * 2. Generates a secure reset token.
 * 3. Sends the token to the user via email for password recovery.
 */
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const user = await getUserByEmail(email);

    if (!user) return res.status(404).json({ error: "User not found" });

    const token = generateResetToken(email);
    await sendResetPasswordEmail(email, token);

    return res.json({ message: "Password recovery email sent successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Resets the user's password using a valid reset token.
 * @async
 * @function resetPassword
 * @param {Request} req - Express request object containing `token` and `newPassword` in the body.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} - Returns a confirmation message upon successful password update.
 * 
 * @description
 * This function:
 * 1. Verifies the reset token and extracts the associated email.
 * 2. Hashes the new password using bcrypt.
 * 3. Updates the user's password in the database via Supabase.
 * 4. Returns an error if the token is invalid or expired.
 */
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

    return res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }
}
