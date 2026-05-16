import '@/lib/env';
import NextAuth from 'next-auth';
import LinkedIn from 'next-auth/providers/linkedin';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { useRequestHostWhenAuthUrlIsLocal } from '@/lib/auth-host';
import { prisma } from '@/lib/prisma';

useRequestHostWhenAuthUrlIsLocal();

const hasDatabase = isConfiguredDatabaseUrl(process.env.DATABASE_URL);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: hasDatabase ? PrismaAdapter(prisma) : undefined,
  session: {
    strategy: hasDatabase ? 'database' : 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID,
      clientSecret: process.env.AUTH_LINKEDIN_SECRET,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      return token;
    },
    session({ session, token, user }) {
      if (session.user) {
        session.user.id = user?.id || String(token.id || token.sub || '');
      }

      return session;
    },
  },
});

function isConfiguredDatabaseUrl(value?: string) {
  return Boolean(value && !value.includes('USER:PASSWORD') && !value.includes('replace-with'));
}
