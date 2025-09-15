import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from './db';
import { users } from '../../drizzle-db/schema';
import { eq } from 'drizzle-orm';

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
    async signIn({ user }) {
      if (user.email) {
        try {
          // Check if user exists by email
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (existingUser.length === 0) {
            // Create new user with UUID
            await db.insert(users).values({
              name: user.name,
              email: user.email,
              image: user.image,
            });
          }
        } catch (error) {
          console.error('Failed to create user record:', error);
          // Don't block sign-in if database insert fails
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.databaseUserId) {
        session.user.id = token.databaseUserId as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      // On first sign in, get the database user ID
      if (user && user.email) {
        try {
          const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (dbUser.length > 0) {
            token.databaseUserId = dbUser[0].id;
          }
        } catch (error) {
          console.error('Failed to fetch user from database:', error);
        }
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
