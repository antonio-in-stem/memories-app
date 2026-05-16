import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { Experience } from '@/components/Experience';
import { getCohorte65Directory } from '@/server/repositories/memories';

export default async function CirclePage({ params }: { params: Promise<{ circleId: string }> }) {
  const [{ circleId }, session] = await Promise.all([params, auth()]);

  if (!session?.user) {
    redirect('/');
  }

  if (circleId !== 'cohorte-65') {
    notFound();
  }

  const directory = await getCohorte65Directory();

  return <Experience directory={directory} viewer={session.user} />;
}
