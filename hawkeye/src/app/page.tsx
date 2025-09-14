import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();

  console.log(session);

  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">
          Welcome to HawkEye
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          AWS Cost Optimization Platform - Simplify your cloud management with
          intelligent recommendations
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/auth/signin">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
