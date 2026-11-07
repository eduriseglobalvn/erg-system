const MAX_EDGE_PX = 1024;
const JPEG_QUALITY = 0.8;
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

/** Camera fallback: same resize as the live camera (<= 1024 px JPEG 0.8). Falls back to the raw file only when it is <= 2 MB. */
export async function resizePhotoFile(file: File): Promise<Blob> {
  try {
    const img = await decode(file);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (blob) return blob;
  } catch {
    // fall through to the size check below
  }
  if (file.size > MAX_PHOTO_BYTES) throw new Error(PHOTO_TOO_LARGE);
  return file;
}
