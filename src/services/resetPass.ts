import nodemailer from "nodemailer";

/**
 * Sends a password reset email to a specified user using Gmail's SMTP service.
 *
 * This function creates a transporter with Nodemailer using environment
 * variables for authentication (`EMAIL_USER` and `EMAIL_PASS`), then sends
 * a reset password email containing a unique token link.
 *
 * @async
 * @function sendResetPasswordEmail
 * @param {string} to - The recipient's email address.
 * @param {string} token - The unique reset token to include in the email link.
 * @returns {Promise<void>} A promise that resolves when the email is successfully sent.
 * @throws {Error} If the email fails to send or transporter configuration is invalid.
 *
 * @example
 * await sendResetPasswordEmail("user@example.com", "12345abcdef");
 *
 * // This will send an email to "user@example.com" with a link like:
 * // https://yourfrontend.com/reset-password?token=12345abcdef
 */
export async function sendResetPasswordEmail(to: string, token: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Soporte PopFlix" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Recupera tu contraseña",
    html: `
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para continuar:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Este enlace expirará en 15 minutos.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
