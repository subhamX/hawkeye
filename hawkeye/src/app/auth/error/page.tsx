import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AuthErrorPageProps {
  searchParams: {
    error?: string;
  };
}

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error } = searchParams;

  const getErrorMessage = (error?: string) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Authentication Error
          </h1>
          <p className="mt-4 text-muted-foreground">
            {getErrorMessage(error)}
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/signin">Try Again</Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Go Home</Link>
          </Button>
        </div>

        {error && (
          <div className="mt-8 p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Error code: {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}