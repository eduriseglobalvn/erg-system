import { useCallback, useEffect, useRef, type InputHTMLAttributes, type RefObject } from "react";

const MAX_EDGE_PX = 1024;
const JPEG_QUALITY = 0.8;

/** Front-camera selfie. Where getUserMedia is missing, render `<input {...fallbackInputProps} />` instead. */
export function useCameraCapture(): {
  videoRef: RefObject<HTMLVideoElement | null>;
  start(): Promise<void>;
  stop(): void;
  capture(): Promise<Blob>;
  supported: boolean;
  fallbackInputProps: InputHTMLAttributes<HTMLInputElement>;
} {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const supported = typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function";

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: false });
    const video = videoRef.current;
    // Unmounted (or no element) while the permission prompt was open: release the camera at once.
    if (!mounted.current || !video) {
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
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Không chụp được ảnh"))), "image/jpeg", JPEG_QUALITY);
    });
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
