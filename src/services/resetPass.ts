import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía un correo de restablecimiento de contraseña usando Resend.
 *
 * @param {string} to - Dirección del destinatario.
 * @param {string} token - Token único de restablecimiento.
 */
export async function sendResetPasswordEmail(to: string, token: string) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin: 0;">Soporte PopFix</h1>
      </div>
      
      <div style="background-color: #e7e7e7; padding: 30px; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">Restablecer Contraseña</h2>
        
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña en PopFix.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
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
        <span style="word-break: break-all;">${resetLink}</span>
      </p>
    </div>
  `;

  await resend.emails.send({
    from: "Soporte PopFix <onboarding@resend.dev>", // Puedes cambiarlo al verificar tu dominio
    to,
    subject: "Restablecer Contraseña - Soporte PopFix",
    html: htmlContent,
  });

  console.log("✅ Correo enviado con Resend");
}