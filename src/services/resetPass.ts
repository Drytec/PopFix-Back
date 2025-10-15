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
  // Configuración SMTP completa, compatible con Gmail y otros proveedores
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true", // true para 465, false para otros
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
    },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Soporte PopFix" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Restablecer Contraseña - Soporte PopFix",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Soporte PopFix</h1>
        </div>
        
        <div style="background-color: #e7e7e7; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">Restablecer Contraseña</h2>
          
          <p>Hola,</p>
          
          <p>Recibimos una solicitud para restablecer tu contraseña en PopFix.</p>
          
          <p>Para continuar con el proceso, haz clic en el siguiente botón:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #000000; 
                      color: #ffffff; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block;
                      font-weight: bold;">
              Restablecer Contraseña
            </a>
          </div>
          
          <div style="background-color: #d9d9d9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>⚠️ Importante:</strong></p>
            <ul style="color: #333; margin: 10px 0;">
              <li>Este enlace expirará en <strong>15 minutos</strong> por seguridad</li>
              <li>Solo puedes usar este enlace una vez</li>
              <li>Si no solicitaste este cambio, ignora este email</li>
            </ul>
          </div>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e7e7e7; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          Este es un mensaje automático de PopFix. Por favor, no respondas a este email.
        </p>
        
        <p style="color: #999; font-size: 12px;">
          Si tienes problemas con el enlace, copia y pega esta URL en tu navegador:<br>
          <span style="word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
