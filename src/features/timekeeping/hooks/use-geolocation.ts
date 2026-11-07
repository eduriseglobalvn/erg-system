import { useCallback, useEffect, useRef, useState } from "react";

export type GeoReading = { lat: number; lng: number; accuracyM: number; at: number };
export type GeoError = "denied" | "unavailable" | "timeout" | "insecure";

const ERROR_BY_CODE: Record<number, GeoError> = { 1: "denied", 2: "unavailable", 3: "timeout" };

/** Live GPS fix via watchPosition so accuracy keeps improving while the screen is open. Call `request()` from a user action. */
export function useGeolocation(opts: { timeoutMs?: number } = {}): {
  reading: GeoReading | null;
  error: GeoError | null;
  request(): void;
} {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const [reading, setReading] = useState<GeoReading | null>(null);
  const [error, setError] = useState<GeoError | null>(null);
  const watchId = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current);
    watchId.current = null;
  }, []);

  const request = useCallback(() => {
    stop();
    if (typeof window !== "undefined" && window.isSecureContext === false) return setError("insecure");
    if (typeof navigator === "undefined" || !navigator.geolocation) return setError("unavailable");
    setError(null);
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setError(null);
        setReading({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyM: position.coords.accuracy,
          at: position.timestamp,
        });
      },
      (failure) => setError(ERROR_BY_CODE[failure.code] ?? "unavailable"),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  }, [stop, timeoutMs]);

  useEffect(() => stop, [stop]);
  return { reading, error, request };
}
