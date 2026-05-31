import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendVerificationCode = async (to: string, code: string) => {
  await transporter.sendMail({
    from: `"Athlos" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Código de verificación - Athlos",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">Verifica tu cuenta en Athlos</h2>
        <p style="color: #555; font-size: 15px;">Tu código de verificación es:</p>
        <div style="background: #1a1a2e; color: #fff; font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 8px; margin: 24px 0;">
          ${code}
        </div>
        <p style="color: #888; font-size: 13px;">Este código expira en 10 minutos. Si no solicitaste este registro, ignora este correo.</p>
      </div>
    `,
    text: `Tu código de verificación de Athlos es: ${code}`,
  });
};