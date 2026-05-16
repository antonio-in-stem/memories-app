-- CreateTable
CREATE TABLE "image_assets" (
    "id" TEXT NOT NULL,
    "uploader_id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'image/webp',
    "data" BYTEA NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "original_byte_size" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "image_assets_uploader_id_idx" ON "image_assets"("uploader_id");

-- AddForeignKey
ALTER TABLE "image_assets" ADD CONSTRAINT "image_assets_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
