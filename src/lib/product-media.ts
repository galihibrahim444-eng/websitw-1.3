/**
 * Struktur media produk yang dinormalisasi.
 * Seluruh UI (grid foto, upload video, form Tambah/Edit Produk) membaca dan
 * menulis ke bentuk ini. Bentuk `url`/`id`/`position`/`isCover`/`duration`
 * cocok dengan payload yang nantinya dikirim ke Shopee Open API — field lokal
 * (`file`, `progress`, `status`) hanya dipakai selama upload dan tidak
 * dikirim ke marketplace.
 */

export type ProductImage = {
  id: string;
  url: string;
  position: number;
  isCover: boolean;
  width: number;
  height: number;
  fileSize: number;
  /** Local-only. Tidak dikirim ke marketplace. */
  file?: File;
};

export type ProductVideoStatus = "uploading" | "success" | "error";

export type ProductVideoMedia = {
  id: string;
  url: string;
  duration: number;
  thumbnail: string | null;
  fileSize: number;
  /** Local-only. */
  file?: File;
  progress?: number;
  status?: ProductVideoStatus;
  errorMessage?: string;
};

export type ProductMedia = {
  images: ProductImage[];
  video: ProductVideoMedia | null;
};

export const emptyProductMedia = (): ProductMedia => ({
  images: [],
  video: null,
});

/**
 * Menyusun ulang array gambar agar `position` selalu sekuensial (0..n) dan
 * `isCover` selalu true hanya pada foto pertama.
 */
export function normalizeImages(images: ProductImage[]): ProductImage[] {
  // Urutan array = urutan tampilan. Jangan menyortir ulang berdasarkan
  // `position` lama — itu akan membatalkan hasil reorder drag & drop.
  return images.map((img, idx) => ({
    ...img,
    position: idx,
    isCover: idx === 0,
  }));
}

/** Membaca lebar/tinggi natural sebuah file gambar. */
export function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number; url: string }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight, url });
    img.onerror = () => resolve({ width: 0, height: 0, url });
    img.src = url;
  });
}

export function createMediaId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
