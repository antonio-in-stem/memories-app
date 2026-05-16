import { NextResponse } from 'next/server';

import { createComment } from '@/server/services/mutations';

export async function POST(request: Request) {
  const result = await createComment(await request.json().catch(() => null));

  return NextResponse.json(result.body, { status: result.status });
}
