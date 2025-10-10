import nodemailer from "nodemailer";

export async function sendResetPasswordEmail(to: string, token: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  console.log(process.env.FRONTEND_URL);
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
