import { NextResponse } from 'next/server';
import { favoriteMemory } from '@/server/services/reactions';

export async function POST(_request: Request, context: { params: Promise<{ memoryId: string }> }) {
  const { memoryId } = await context.params;
  const result = await favoriteMemory(memoryId);

  return NextResponse.json(result.body, { status: result.status });
}
