import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Matheus Barbeiro <noreply@resend.dev>"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: "Redefinir senha — Matheus Barbeiro",
        html: `
          <div style="background:#0c0b09;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px 16px;max-width:480px;margin:0 auto">
            <p style="color:#c9a227;font-size:11px;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 24px">MATHEUS BARBEIRO</p>
            <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 12px">Redefinir sua senha</h1>
            <p style="color:#c4bfb4;font-size:14px;margin:0 0 24px">Clique no botão abaixo para criar uma nova senha. O link expira em 1 hora.</p>
            <a href="${url}" style="display:inline-block;background:#c9a227;color:#000;font-size:13px;font-weight:700;text-decoration:none;padding:14px 28px;letter-spacing:0.05em">REDEFINIR SENHA</a>
            <p style="color:#6b6558;font-size:11px;margin:24px 0 0">Se você não solicitou isso, ignore este email.</p>
          </div>
        `,
      })
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    },
  },
})
