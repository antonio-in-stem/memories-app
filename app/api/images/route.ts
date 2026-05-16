import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { compressImage, validateImageFile } from '@/server/services/images';
import { ensureProfileForUser } from '@/server/services/profiles';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('image');
  const validation = await validateImageFile(file instanceof File ? file : null);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const profile = await ensureProfileForUser(session.user);
  const compressed = await compressImage(validation.bytes, validation.originalByteSize).catch(() => null);

  if (!compressed) {
    return NextResponse.json({ error: 'Image could not be processed.' }, { status: 400 });
  }
  const asset = await prisma.imageAsset.create({
    data: {
      uploaderId: profile.id,
      mimeType: compressed.mimeType,
      data: new Uint8Array(compressed.data),
      byteSize: compressed.byteSize,
      originalByteSize: compressed.originalByteSize,
      width: compressed.width,
      height: compressed.height,
    },
    select: {
      id: true,
      byteSize: true,
      originalByteSize: true,
      width: true,
      height: true,
    },
  });

  return NextResponse.json(
    {
      id: asset.id,
      url: `/api/images/${asset.id}`,
      byteSize: asset.byteSize,
      originalByteSize: asset.originalByteSize,
      width: asset.width,
      height: asset.height,
    },
    { status: 201 },
  );
}
