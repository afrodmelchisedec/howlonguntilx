import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import { createTransport } from 'nodemailer';

function getEmailProvider() {
  const host = process.env.EMAIL_SERVER_HOST;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.EMAIL_FROM ?? 'noreply@howlonguntilx.com';
  if (!host || !user || !pass) return null;
  return EmailProvider({
    server: { host, port: Number(process.env.EMAIL_SERVER_PORT ?? 587), secure: false, auth: { user, pass } },
    from,
    sendVerificationRequest: async ({ identifier: email, url }) => {
      const t = createTransport({ host, port: Number(process.env.EMAIL_SERVER_PORT ?? 587), secure: false, auth: { user, pass } });
      await t.sendMail({
        to: email, from: 'HowLongUntil <' + from + '>',
        subject: 'Sign in to HowLongUntil',
        html: '<div style="font-family:system-ui,sans-serif;max-width:420px;margin:40px auto;padding:32px;border:1px solid #eee;border-radius:16px;"><h2 style="font-size:20px;font-weight:500;">HowLongUntil</h2><p style="color:#555;margin-bottom:24px;font-size:14px;">Click below to sign in.</p><a href="' + url + '" style="display:inline-block;background:#534AB7;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:500;">Sign in →</a></div>',
      });
    },
  });
}

const emailProvider = getEmailProvider();

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email Sign In',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } });
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! })]
      : []),
    ...(emailProvider ? [emailProvider] : []),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, plan: true, subscriptionStatus: true, trialEndsAt: true },
        });
        token.role = dbUser?.role ?? 'USER';
        token.plan = dbUser?.plan ?? 'FREE';
        token.subscriptionStatus = dbUser?.subscriptionStatus ?? 'none';
        token.trialEndsAt = dbUser?.trialEndsAt ? dbUser.trialEndsAt.toISOString() : null;
      }
      return token;
    },
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id:   token.id   as string,
          role: token.role as string,
          plan: token.plan as string,
          subscriptionStatus: token.subscriptionStatus as string,
          trialEndsAt: token.trialEndsAt as string | null,
        },
      };
    },
  },
  pages: { signIn: '/auth/signin', error: '/auth/error' },
  secret: process.env.NEXTAUTH_SECRET,
};
