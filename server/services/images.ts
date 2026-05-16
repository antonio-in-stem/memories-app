import sharp from 'sharp';

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_EDGE = 1920;
export const OUTPUT_QUALITY = 82;
export const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export type ImageValidationResult =
  | { ok: true; bytes: Uint8Array; mimeType: string; originalByteSize: number }
  | { ok: false; status: 400 | 413 | 415; error: string };

export type CompressedImage = {
  data: Buffer;
  mimeType: 'image/webp';
  byteSize: number;
  originalByteSize: number;
  width: number;
  height: number;
};

export async function validateImageFile(file: File | null): Promise<ImageValidationResult> {
  if (!file) {
    return { ok: false, status: 400, error: 'Image file is required.' };
  }

  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, status: 415, error: 'Unsupported image type.' };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, status: 413, error: 'Image exceeds the upload size limit.' };
  }

  return {
    ok: true,
    bytes: new Uint8Array(await file.arrayBuffer()),
    mimeType: file.type,
    originalByteSize: file.size,
  };
}

export async function compressImage(input: Uint8Array, originalByteSize = input.byteLength): Promise<CompressedImage> {
  const pipeline = sharp(input, {
    failOn: 'error',
    limitInputPixels: 36_000_000,
  })
    .rotate()
    .resize({
      width: MAX_IMAGE_EDGE,
      height: MAX_IMAGE_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: OUTPUT_QUALITY,
      effort: 6,
      smartSubsample: true,
      nearLossless: false,
    });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    data,
    mimeType: 'image/webp',
    byteSize: data.byteLength,
    originalByteSize,
    width: info.width,
    height: info.height,
  };
}
