import nodemailer from "nodemailer";

function getTransport() {
  // In dev mode, log to console instead of sending real mail
  if (!process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerificationEmail(email: string, code: string) {
  const transport = getTransport();

  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || "VeriCampus <noreply@vericampus.app>",
    to: email,
    subject: "Your VeriCampus Verification Code",
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>VeriCampus Verification</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; padding: 16px; background: #f4f4f5; border-radius: 8px;">${code}</p>
        <p style="color: #71717a; font-size: 14px;">This code expires in 10 minutes.</p>
      </div>
    `,
  });

  // Dev mode: log to console
  if (!process.env.SMTP_HOST) {
    console.log("─── DEV EMAIL ───────────────────────────────");
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    console.log("──────────────────────────────────────────────");
  }

  return info;
}
