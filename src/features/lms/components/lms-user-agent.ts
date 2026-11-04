const BROWSERS: Array<[RegExp, string]> = [
  [/Edg(?:e|A|iOS)?\//i, "Edge"],
  [/OPR\/|Opera/i, "Opera"],
  [/Firefox\/|FxiOS\//i, "Firefox"],
  [/CriOS\/|Chrome\//i, "Chrome"],
  [/Safari\//i, "Safari"],
];
const SYSTEMS: Array<[RegExp, string]> = [
  [/iPhone|iPad|iPod|iOS/i, "iOS"],
  [/Android/i, "Android"],
  [/Windows/i, "Windows"],
  [/Macintosh|Mac OS X|macOS/i, "macOS"],
  [/CrOS/i, "ChromeOS"],
  [/Linux/i, "Linux"],
];

/** "Mozilla/5.0 ... Chrome/125 ... Windows NT 10.0" -> "Chrome · Windows". */
export function describeUserAgent(userAgent?: string | null): string {
  const ua = userAgent?.trim() ?? "";
  const browser = BROWSERS.find(([pattern]) => pattern.test(ua))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(ua))?.[1];
  return [browser, system].filter(Boolean).join(" · ") || "Thiết bị không xác định";
}

/** Loopback addresses (::1, 0:0:0:0:0:0:0:1, 127.x) are shown as "localhost". */
export function describeIpAddress(ip?: string | null): string {
  const value = ip?.trim() ?? "";
  if (!value) return "—";
  if (value === "::1" || /^127\./.test(value) || /^(0{1,4}:)+0{0,3}1$/.test(value) || /^(0{1,4}:){3,7}0{1,4}$/.test(value)) {
    return "localhost";
  }
  return value;
}
