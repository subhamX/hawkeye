import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import HeroSectionSimple from '@/components/hero-section-simple';

export default async function Home() {
  const session = await auth();

  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return <HeroSectionSimple />;
}
