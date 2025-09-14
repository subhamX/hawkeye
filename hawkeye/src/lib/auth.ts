import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from './db';
import { users } from '../../drizzle-db/schema';

const config: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Insert user into database on first sign-in
      if (user.id && user.email) {
        try {
          await db.insert(users).values({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          }).onConflictDoNothing(); // Don't insert if user already exists
        } catch (error) {
          console.error('Failed to create user record:', error);
          // Don't block sign-in if database insert fails
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);