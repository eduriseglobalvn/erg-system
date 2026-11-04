import { describe, expect, it } from "vitest";
import { describeIpAddress, describeUserAgent } from "./lms-user-agent";

describe("describeUserAgent", () => {
  it("parses common desktop and mobile agents", () => {
    expect(describeUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36")).toBe("Chrome · Windows");
    expect(describeUserAgent("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/125.0 Safari/537.36 Edg/125.0")).toBe("Edge · Windows");
    expect(describeUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1")).toBe("Safari · iOS");
    expect(describeUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; rv:126.0) Gecko/20100101 Firefox/126.0")).toBe("Firefox · macOS");
  });

  it("falls back for empty input", () => {
    expect(describeUserAgent("")).toBe("Thiết bị không xác định");
    expect(describeUserAgent(undefined)).toBe("Thiết bị không xác định");
  });
});

describe("describeIpAddress", () => {
  it("maps loopback to localhost", () => {
    expect(describeIpAddress("::1")).toBe("localhost");
    expect(describeIpAddress("0:0:0:0:0:0:0:1")).toBe("localhost");
    expect(describeIpAddress("127.0.0.1")).toBe("localhost");
  });

  it("keeps public addresses and handles empty", () => {
    expect(describeIpAddress("113.161.84.21")).toBe("113.161.84.21");
    expect(describeIpAddress(null)).toBe("—");
  });
});
