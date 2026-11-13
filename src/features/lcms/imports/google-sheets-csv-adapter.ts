export type GoogleSheetTab = { name: string };

export type GoogleVisualizationCell = {
  v?: string | number | boolean | null;
  f?: string | null;
} | null;

export type GoogleVisualizationResponse = {
  table?: {
    cols?: Array<{ label?: string }>;
    rows?: Array<{ c?: GoogleVisualizationCell[] }>;
  };
};

type RequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

export function parseGoogleSheetUrl(input: string) {
  const idMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  const gidMatch = input.match(/[?#&]gid=(\d+)/);

  if (!idMatch?.[1]) throw new Error("Link Google Sheet chưa đúng định dạng.");

  return { spreadsheetId: idMatch[1], gid: gidMatch?.[1] ?? "0" };
}

export function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export async function fetchGoogleSheetCsv(input: string, options: RequestOptions & { sheetName?: string } = {}) {
  const { spreadsheetId, gid } = parseGoogleSheetUrl(input);
  const request = createTimedSignal(options);

  try {
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&${options.sheetName ? `sheet=${encodeURIComponent(options.sheetName)}` : `gid=${gid}`}`,
      { signal: request.signal },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseCsvRows(await response.text());
  } catch (error) {
    if (options.signal?.aborted) throw options.signal.reason ?? error;
    if (request.timedOut()) throw new Error("Google Sheet phản hồi quá lâu. Vui lòng thử lại.");
    throw new Error("Không đọc được Google Sheets. Kiểm tra quyền chia sẻ bằng liên kết.", { cause: error });
  } finally {
    request.cleanup();
  }
}

export async function fetchGoogleSheetTabs(spreadsheetId: string, options: RequestOptions = {}): Promise<GoogleSheetTab[]> {
  const request = createTimedSignal(options);
  try {
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`, {
      signal: request.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const captions = Array.from(html.matchAll(/docs-sheet-tab-caption">([^<]+)</g))
      .map((match) => decodeHtml(match[1] ?? "").trim())
      .filter(Boolean);
    if (!captions.length) {
      for (const match of html.matchAll(/"name":"([^"]+)"[,\s]*"sheetId":/g)) {
        if (match[1]) captions.push(decodeHtml(match[1]).trim());
      }
      for (const match of html.matchAll(/"sheetId":\d+[,\s]*"name":"([^"]+)"/g)) {
        if (match[1]) captions.push(decodeHtml(match[1]).trim());
      }
    }
    return Array.from(new Set(captions)).filter((name) => name && !name.startsWith("docs-")).map((name) => ({ name }));
  } catch (error) {
    if (options.signal?.aborted) throw options.signal.reason ?? error;
    if (request.timedOut()) throw new Error("Google Sheet phản hồi quá lâu. Vui lòng thử lại.");
    throw new Error("Không đọc được danh sách tab trong Google Sheet.", { cause: error });
  } finally {
    request.cleanup();
  }
}

// fetch, not a JSONP <script>: the CSP keeps script-src 'self', and gviz answers CORS like the CSV export.
export async function fetchGoogleSheetTable({
  spreadsheetId,
  gid,
  sheetName,
  ...options
}: RequestOptions & {
  spreadsheetId: string;
  gid: string;
  sheetName?: string;
}): Promise<GoogleVisualizationResponse> {
  const request = createTimedSignal(options);
  const params = new URLSearchParams({ tqx: "out:json" });
  if (sheetName) params.set("sheet", sheetName);
  else params.set("gid", gid);

  let payload: GoogleVisualizationResponse;
  try {
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`, {
      signal: request.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // The body is `/*O_o*/ google.visualization.Query.setResponse({...});`.
    const text = await response.text();
    payload = JSON.parse(text.slice(text.indexOf("(") + 1, text.lastIndexOf(")"))) as GoogleVisualizationResponse;
  } catch (error) {
    if (options.signal?.aborted) throw options.signal.reason ?? error;
    if (request.timedOut()) throw new Error("Google Sheet phản hồi quá lâu. Kiểm tra lại quyền chia sẻ hoặc tệp sheet.");
    throw new Error("Không tải được Google Sheet. Tệp sheet cần được cấp quyền xem công khai.", { cause: error });
  } finally {
    request.cleanup();
  }
  if (!payload.table) throw new Error("Không đọc được dữ liệu trong sheet.");
  return payload;
}

function createTimedSignal({ signal, timeoutMs = DEFAULT_TIMEOUT_MS }: RequestOptions) {
  const controller = new AbortController();
  let didTimeout = false;
  const relayAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", relayAbort, { once: true });
  if (signal?.aborted) relayAbort();
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort(new DOMException("Timed out", "TimeoutError"));
  }, timeoutMs);

  return {
    signal: controller.signal,
    timedOut: () => didTimeout,
    cleanup: () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", relayAbort);
    },
  };
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
