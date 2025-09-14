import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default async function ProtectedRoute({ children }: ProtectedRouteProps) {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return <>{children}</>;
}