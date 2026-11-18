import { encodeSmallJpeg } from "../../hooks/use-camera-capture";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const PHOTO_TOO_LARGE = "Ảnh tối đa 2 MB";

function decode(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
    img.src = url;
  });
}

/** Camera fallback: same encoding as the live camera (under 5 KB). Falls back to the raw file only when it cannot be decoded and is <= 2 MB. */
export async function resizePhotoFile(file: File): Promise<Blob> {
  try {
    const img = await decode(file);
    const blob = await encodeSmallJpeg(img, img.naturalWidth, img.naturalHeight);
    if (blob) return blob;
  } catch {
    // fall through to the size check below
  }
  if (file.size > MAX_PHOTO_BYTES) throw new Error(PHOTO_TOO_LARGE);
  return file;
}
