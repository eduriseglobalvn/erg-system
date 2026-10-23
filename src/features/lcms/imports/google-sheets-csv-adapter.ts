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

export async function fetchGoogleSheetCsv(input: string, options: RequestOptions = {}) {
  const { spreadsheetId, gid } = parseGoogleSheetUrl(input);
  const request = createTimedSignal(options);

  try {
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
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
    return Array.from(new Set(captions)).map((name) => ({ name }));
  } catch (error) {
    if (options.signal?.aborted) throw options.signal.reason ?? error;
    if (request.timedOut()) throw new Error("Google Sheet phản hồi quá lâu. Vui lòng thử lại.");
    throw new Error("Không đọc được danh sách tab trong Google Sheet.", { cause: error });
  } finally {
    request.cleanup();
  }
}

export function loadGoogleSheetViaJsonp({
  spreadsheetId,
  gid,
  sheetName,
  signal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  spreadsheetId: string;
  gid: string;
  sheetName?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}) {
  return new Promise<GoogleVisualizationResponse>((resolve, reject) => {
    const callbackName = `__ergSheetImport_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const registry = window as unknown as Record<string, (payload: GoogleVisualizationResponse) => void>;

    const cleanup = () => {
      delete registry[callbackName];
      script.remove();
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", handleAbort);
    };
    const handleAbort = () => {
      cleanup();
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Google Sheet phản hồi quá lâu. Kiểm tra lại quyền chia sẻ hoặc tệp sheet."));
    }, timeoutMs);

    if (signal?.aborted) {
      handleAbort();
      return;
    }
    signal?.addEventListener("abort", handleAbort, { once: true });
    registry[callbackName] = (payload) => {
      cleanup();
      if (!payload.table) reject(new Error("Không đọc được dữ liệu trong sheet."));
      else resolve(payload);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("Không tải được Google Sheet. Tệp sheet cần được cấp quyền xem công khai."));
    };

    const params = new URLSearchParams({ tqx: `out:json;responseHandler:${callbackName}` });
    if (sheetName) params.set("sheet", sheetName);
    else params.set("gid", gid);
    script.src = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`;
    document.body.appendChild(script);
  });
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
