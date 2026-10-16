import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchGoogleSheetCsv,
  parseCsvRows,
  parseGoogleSheetUrl,
} from "@/features/lcms/imports/google-sheets-csv-adapter";

afterEach(() => vi.unstubAllGlobals());

describe("Google Sheets CSV adapter", () => {
  it("validates and extracts spreadsheet id and gid", () => {
    expect(parseGoogleSheetUrl("https://docs.google.com/spreadsheets/d/sheet_123/edit#gid=42")).toEqual({
      spreadsheetId: "sheet_123",
      gid: "42",
    });
    expect(() => parseGoogleSheetUrl("https://example.com/not-a-sheet")).toThrow("chưa đúng định dạng");
  });

  it("parses quoted CSV cells deterministically", () => {
    expect(parseCsvRows('name,note\r\n"Nguyen, An","said ""hello"""')).toEqual([
      ["name", "note"],
      ["Nguyen, An", 'said "hello"'],
    ]);
  });

  it("forwards cancellation and maps failed responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("denied", { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await expect(fetchGoogleSheetCsv("https://docs.google.com/spreadsheets/d/sheet_123/edit#gid=42", {
      signal: controller.signal,
    })).rejects.toThrow("Không đọc được Google Sheets");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("gid=42"), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
});
