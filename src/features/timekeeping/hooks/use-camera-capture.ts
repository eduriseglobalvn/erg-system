import { useCallback, useEffect, useRef, type InputHTMLAttributes, type RefObject } from "react";

export type CameraFacing = "user" | "environment";

/** Owner's rule (18/11/2026): a punch photo is stored under 5 KB. It proves presence; it is not a portrait. */
export const TARGET_PHOTO_BYTES = 5 * 1024;
// Longest edge and JPEG quality, tried in order until the photo fits. JPEG only: Safari 15 cannot encode WebP.
const ENCODE_STEPS = [[240, 0.5], [240, 0.35], [200, 0.35], [160, 0.35], [160, 0.25], [128, 0.25], [96, 0.2]] as const;

/** Smallest-needed downscale of a camera frame or picked image; null when the browser cannot encode at all. */
export async function encodeSmallJpeg(source: CanvasImageSource, width: number, height: number): Promise<Blob | null> {
  let smallest: Blob | null = null;
  for (const [edge, quality] of ENCODE_STEPS) {
    const scale = Math.min(1, edge / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) break;
    smallest = blob;
    if (blob.size <= TARGET_PHOTO_BYTES) break;
  }
  return smallest;
}

/** Front-camera selfie. Where getUserMedia is missing, render `<input {...fallbackInputProps} />` instead. */
export function useCameraCapture(): {
  videoRef: RefObject<HTMLVideoElement | null>;
  start(facingMode?: CameraFacing): Promise<void>;
  stop(): void;
  capture(): Promise<Blob>;
  supported: boolean;
  fallbackInputProps: InputHTMLAttributes<HTMLInputElement>;
} {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const startId = useRef(0);
  const supported = typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function";

  const stop = useCallback(() => {
    startId.current += 1; // a pending start() must not attach its stream after this
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(async (facingMode: CameraFacing = "user") => {
    stop();
    const id = ++startId.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 } }, audio: false });
    const video = videoRef.current;
    // Unmounted, superseded by a newer start() (camera switch), or no element while the prompt was open: release at once.
    if (!mounted.current || !video || id !== startId.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    streamRef.current = stream;
    // iOS 15 refuses inline autoplay unless both are set on the element before play().
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    try {
      await video.play();
    } catch (error) {
      stop();
      throw error;
    }
  }, [stop]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) throw new Error("Camera chưa sẵn sàng");
    const blob = await encodeSmallJpeg(video, video.videoWidth, video.videoHeight);
    if (!blob) throw new Error("Không chụp được ảnh");
    return blob;
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stop();
    };
  }, [stop]);
  return { videoRef, start, stop, capture, supported, fallbackInputProps: { type: "file", accept: "image/*", capture: "user" } };
}
