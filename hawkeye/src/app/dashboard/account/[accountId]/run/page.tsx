import { redirect } from 'next/navigation';

interface RunPageProps {
  params: Promise<{
    accountId: string;
  }>;
}

export default async function RunPage({ params }: RunPageProps) {
  const { accountId } = await params;
  // Redirect to the account dashboard where the analysis trigger is located
  redirect(`/dashboard/account/${accountId}`);
}
