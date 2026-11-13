import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchGoogleSheetCsv,
  fetchGoogleSheetTable,
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

  it("reads the gviz table with fetch, not a JSONP script the CSP would block", async () => {
    const table = { cols: [{ label: "Họ tên" }], rows: [{ c: [{ v: "An (10A1)" }] }] };
    const fetchMock = vi.fn().mockResolvedValue(new Response(`/*O_o*/\ngoogle.visualization.Query.setResponse(${JSON.stringify({ table })});`));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchGoogleSheetTable({ spreadsheetId: "sheet_123", gid: "0", sheetName: "10A1" })).resolves.toEqual({ table });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("tqx=out%3Ajson&sheet=10A1"), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(document.querySelector("script")).toBeNull();
  });

  it("maps a gviz response without a table to a readable error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('google.visualization.Query.setResponse({"status":"error"});')));

    await expect(fetchGoogleSheetTable({ spreadsheetId: "sheet_123", gid: "0" })).rejects.toThrow("Không đọc được dữ liệu trong sheet.");
  });
});
