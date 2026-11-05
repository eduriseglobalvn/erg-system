export const QUIZ_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const QUIZ_IMAGE_MAX_EDGE = 1600;
export const QUIZ_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;

const REJECT_MESSAGES = {
  type: "Chỉ nhận ảnh PNG, JPG, GIF hoặc WebP.",
  size: "Ảnh lớn hơn 5 MB.",
} as const;

export class QuizImageRejectedError extends Error {
  readonly reason: "type" | "size";

  constructor(reason: "type" | "size") {
    super(REJECT_MESSAGES[reason]);
    this.name = "QuizImageRejectedError";
    this.reason = reason;
  }
}

export function fitWithin(width: number, height: number, maxEdge = QUIZ_IMAGE_MAX_EDGE): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };
  const scale = maxEdge / longEdge;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export type ImageResizer = (file: File, target: { width: number; height: number }) => Promise<string>;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không đọc được ảnh."));
    image.src = src;
  });
}

// Decodes a data URL; shared with the uploader so both agree on how size is read.
export async function readImageSize(src: string): Promise<{ width: number; height: number }> {
  const image = await loadImage(src);
  return { width: image.naturalWidth, height: image.naturalHeight };
}

// HTMLImageElement + canvas, because Safari 15 lacks createImageBitmap options.
const resizeWithCanvas: ImageResizer = async (file, target) => {
  const image = await loadImage(await readAsDataUrl(file));
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  canvas.getContext("2d")?.drawImage(image, 0, 0, target.width, target.height);
  return canvas.toDataURL(file.type);
};

export async function prepareQuizImage(
  file: File,
  deps: {
    readSize?: (file: File) => Promise<{ width: number; height: number }>;
    resize?: ImageResizer;
    read?: (file: File) => Promise<string>;
  } = {},
): Promise<{ dataUrl: string; width: number; height: number }> {
  if (!(QUIZ_IMAGE_TYPES as readonly string[]).includes(file.type)) throw new QuizImageRejectedError("type");
  if (file.size > QUIZ_IMAGE_MAX_BYTES) throw new QuizImageRejectedError("size");
  const read = deps.read ?? readAsDataUrl;
  const readSize = deps.readSize ?? (async (f: File) => readImageSize(await readAsDataUrl(f)));
  const original = await readSize(file);
  // Animated gif would lose its frames on a canvas redraw, so it passes through.
  if (file.type === "image/gif") return { dataUrl: await read(file), ...original };
  const target = fitWithin(original.width, original.height);
  if (target.width === original.width && target.height === original.height) return { dataUrl: await read(file), ...original };
  return { dataUrl: await (deps.resize ?? resizeWithCanvas)(file, target), ...target };
}
