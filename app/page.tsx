import { auth } from '@/auth';
import { CircleHome, PublicHome } from '@/components/HomeExperience';
import { getCircleHub } from '@/server/circles';

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    return <PublicHome />;
  }

  const circles = await getCircleHub(session.user);

  return <CircleHome viewer={session.user} circles={circles} />;
}
