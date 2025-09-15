'use server';

import { auth, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default async function UserProfile() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const signOutx = async () => {
    await signOut({ redirectTo: '/' });
  };

  return (
    <div className="flex items-center space-x-4">
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name || 'User'}
          className="rounded-full w-16 h-16"
        />
      )}

      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {session.user.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {session.user.email}
        </span>
      </div>

      <form action={signOutx}>
        <Button variant="outline" size="sm" type="submit">
          Sign Out
        </Button>
      </form>
    </div>
  );
}
