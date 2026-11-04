import { describe, expect, test } from "vitest";
import { formatUserAgent } from "@/features/employee-management/lib/user-agent";

describe("formatUserAgent", () => {
  test("recognises browser and OS", () => {
    expect(formatUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")).toBe("Chrome · Windows");
    expect(formatUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36 Edg/126.0")).toBe("Edge · Windows");
    expect(formatUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1")).toBe("Safari · iOS");
    expect(formatUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; rv:127.0) Gecko/20100101 Firefox/127.0")).toBe("Firefox · macOS");
    expect(formatUserAgent("Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36")).toBe("Chrome · Android");
  });

  test("returns empty string for missing or unknown values", () => {
    expect(formatUserAgent(undefined)).toBe("");
    expect(formatUserAgent("  ")).toBe("");
    expect(formatUserAgent("curl/8.0")).toBe("");
  });
});
