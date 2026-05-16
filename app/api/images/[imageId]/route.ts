import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ imageId: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { imageId } = await context.params;
  const image = await prisma.imageAsset.findUnique({
    where: { id: imageId },
    select: {
      data: true,
      mimeType: true,
      byteSize: true,
      createdAt: true,
    },
  });

  if (!image) {
    return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
  }

  return new NextResponse(image.data, {
    headers: {
      'Content-Type': image.mimeType,
      'Content-Length': String(image.byteSize),
      'Cache-Control': 'private, max-age=31536000, immutable',
      'Last-Modified': image.createdAt.toUTCString(),
    },
  });
}
