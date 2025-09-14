import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
  }
}

declare module '@auth/core/types' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}