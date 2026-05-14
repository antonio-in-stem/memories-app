import { Experience } from '@/components/Experience';
import { getDirectory } from '@/lib/data';

export default function Page() {
  const directory = getDirectory();

  return <Experience directory={directory} />;
}
