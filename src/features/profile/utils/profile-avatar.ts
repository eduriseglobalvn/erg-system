import { CROP_OUTPUT_SIZE, CROP_PREVIEW_SIZE, type AvatarCropState } from "@/features/profile/types/profile-types";
export function getAvatarGeometry(image: { width: number; height: number }, zoom: number, offset: { x: number; y: number }, cropSize: number) {
  const baseScale = cropSize / Math.min(image.width, image.height);
  const scale = baseScale * zoom;
  return { width: image.width * scale, height: image.height * scale, offset: clampAvatarOffset(offset, image, zoom, cropSize) };
}
export function clampAvatarOffset(offset: { x: number; y: number }, image: { width: number; height: number }, zoom: number, cropSize: number) {
  const baseScale = cropSize / Math.min(image.width, image.height);
  const width = image.width * baseScale * zoom; const height = image.height * baseScale * zoom;
  const maxX = Math.max(0, (width - cropSize) / 2); const maxY = Math.max(0, (height - cropSize) / 2);
  const x = Math.min(maxX, Math.max(-maxX, offset.x));
  const y = Math.min(maxY, Math.max(-maxY, offset.y));
  return { x: Object.is(x, -0) ? 0 : x, y: Object.is(y, -0) ? 0 : y };
}
export async function createCroppedAvatarFile(crop: AvatarCropState) {
  if (!crop.image) throw new Error("Ảnh chưa sẵn sàng để crop.");
  const image = await loadImage(crop.previewUrl);
  const geometry = getAvatarGeometry({ width: image.naturalWidth, height: image.naturalHeight }, crop.zoom, crop.offset, CROP_PREVIEW_SIZE);
  const canvas = document.createElement("canvas"); canvas.width = CROP_OUTPUT_SIZE; canvas.height = CROP_OUTPUT_SIZE;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE);
  const factor = CROP_OUTPUT_SIZE / CROP_PREVIEW_SIZE;
  const dx = (CROP_PREVIEW_SIZE / 2 - geometry.width / 2 + geometry.offset.x) * factor;
  const dy = (CROP_PREVIEW_SIZE / 2 - geometry.height / 2 + geometry.offset.y) * factor;
  ctx.drawImage(image, dx, dy, geometry.width * factor, geometry.height * factor);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Không thể tạo file avatar.")), "image/jpeg", 0.9);
  });
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không thể đọc ảnh avatar.")); image.src = src;
  });
}
