import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getExperienceDirectory } from '@/server/repositories/memories';
import { createMemory } from '@/server/services/mutations';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const directory = await getExperienceDirectory();
  return NextResponse.json(directory);
}

export async function POST(request: Request) {
  const result = await createMemory(await request.json().catch(() => null));

  return NextResponse.json(result.body, { status: result.status });
}
