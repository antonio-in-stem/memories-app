import { NextResponse } from 'next/server';
import { favoriteComment } from '@/server/services/reactions';

export async function POST(_request: Request, context: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await context.params;
  const result = await favoriteComment(commentId);

  return NextResponse.json(result.body, { status: result.status });
}
