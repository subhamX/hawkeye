import { redirect } from 'next/navigation';

interface RunPageProps {
  params: {
    accountId: string;
  };
}

export default function RunPage({ params }: RunPageProps) {
  // Redirect to the account dashboard where the analysis trigger is located
  redirect(`/dashboard/account/${params.accountId}`);
}