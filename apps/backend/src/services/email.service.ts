import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  // SMTP credentials from environment variables
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (!host || !user || !pass) {
    throw new Error('Servidor de correo no configurado. Faltan las credenciales SMTP en el servidor.');
  }
  
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
  
  await transporter.sendMail({
    from: `"Papes Confort" <${user}>`,
    to,
    subject,
    html,
  });
}
