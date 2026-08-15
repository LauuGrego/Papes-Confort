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
  
  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    requireTLS: !isSecure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user,
      pass,
    },
  });
  
  const fromEmail = process.env.SMTP_FROM || (user.includes('@') ? user : `noreply@${host}`);

  await transporter.sendMail({
    from: `"Papes Confort" <${fromEmail}>`,
    to,
    subject,
    html,
  });
}
