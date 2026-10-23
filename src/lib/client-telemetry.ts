export const CLIENT_TELEMETRY_MAX_EVENTS = 200;

export type ClientTelemetryOutcome = "cancelled" | "error" | "partial" | "success" | "timeout";
export type ClientTelemetryPortal = "admin" | "crm" | "elearning" | "lcms" | "lms";
export type ClientTelemetryKind = "graphql" | "offline-shell" | "rest";
export type ClientTelemetryNetworkQuality = "degraded" | "offline" | "online";
export type OfflineShellTelemetryState = "conflict" | "degraded" | "failed" | "offline" | "online" | "pending";

export type ClientTelemetryEvent = {
  durationMs: number;
  errorCode?: string;
  kind: ClientTelemetryKind;
  method?: string;
  name: string;
  networkQuality?: ClientTelemetryNetworkQuality;
  outcome: ClientTelemetryOutcome;
  pendingCount?: number;
  conflictCount?: number;
  portal?: ClientTelemetryPortal;
  requestId?: string;
  status?: number;
  timestamp: number;
};

export type ClientTelemetrySink = (event: Readonly<ClientTelemetryEvent>) => Promise<void> | void;

export type ClientTelemetrySummary = {
  averageDurationMs: number;
  cancelledCount: number;
  errorCount: number;
  errorRate: number;
  kind: ClientTelemetryKind;
  method?: string;
  name: string;
  p95DurationMs: number;
  partialCount: number;
  portal?: ClientTelemetryPortal;
  requestCount: number;
};

const events: ClientTelemetryEvent[] = [];
let sink: ClientTelemetrySink | null = null;

const dynamicParentSegments = new Set([
  "academic-years",
  "assets",
  "assignments",
  "attempts",
  "batches",
  "centers",
  "classes",
  "content-items",
  "devices",
  "education-units",
  "grades",
  "media",
  "notifications",
  "permissions",
  "quizzes",
  "roles",
  "schools",
  "sessions",
  "users",
]);

const stableChildSegments = new Set([
  "access",
  "activity",
  "archive",
  "bulk",
  "catalog",
  "current",
  "effective-permissions",
  "heartbeat",
  "import",
  "me",
  "package",
  "preferences",
  "preview",
  "read",
  "read-all",
  "refresh",
  "reset-credential",
  "restore",
  "revoke",
  "role-assignments",
  "roles",
  "security-events",
  "security-feed",
  "sessions",
  "stats",
  "status",
  "unread-count",
  "validate",
]);

export function normalizeTelemetryEndpoint(path: string) {
  const pathname = path.split(/[?#]/, 1)[0] || "/unknown";
  const segments = pathname.split("/").filter(Boolean);
  const normalized = segments.map((segment, index) => {
    const previous = segments[index - 1]?.toLowerCase();
    const decoded = safeDecode(segment).toLowerCase();
    if (segment.includes("%") || isObviouslyDynamicSegment(segment)) return ":id";
    if (previous && dynamicParentSegments.has(previous) && !stableChildSegments.has(decoded)) return ":id";
    return segment;
  });
  return `/${normalized.join("/")}`;
}

export function normalizeGraphQlOperationName(operationName: string) {
  const normalized = operationName.trim();
  return /^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(normalized) ? normalized : "unknown";
}

export function clientTelemetryNow() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export function classifyClientTelemetryOutcome(error: unknown, signal?: AbortSignal): ClientTelemetryOutcome {
  if (signal?.aborted || (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError")) return "cancelled";
  const code = readString(error, "code");
  if (code === "REQUEST_TIMEOUT") return "timeout";
  return "error";
}

export function recordClientTelemetry(input: ClientTelemetryEvent) {
  const event: ClientTelemetryEvent = {
    conflictCount: normalizeQueueCount(input.conflictCount),
    durationMs: normalizeDuration(input.durationMs),
    errorCode: normalizeOptionalLabel(input.errorCode),
    kind: normalizeTelemetryKind(input.kind),
    method: normalizeOptionalLabel(input.method?.toUpperCase()),
    name: input.kind === "graphql"
      ? normalizeGraphQlOperationName(input.name)
      : input.kind === "offline-shell" ? "offline-shell" : normalizeTelemetryEndpoint(input.name),
    networkQuality: normalizeNetworkQuality(input.networkQuality),
    outcome: normalizeOutcome(input.outcome),
    pendingCount: normalizeQueueCount(input.pendingCount),
    portal: normalizePortal(input.portal),
    requestId: normalizeOptionalLabel(input.requestId, 128),
    status: normalizeStatus(input.status),
    timestamp: Number.isFinite(input.timestamp) ? input.timestamp : Date.now(),
  };
  events.push(event);
  if (events.length > CLIENT_TELEMETRY_MAX_EVENTS) {
    events.splice(0, events.length - CLIENT_TELEMETRY_MAX_EVENTS);
  }
  if (!sink) return;
  try {
    void Promise.resolve(sink(Object.freeze({ ...event }))).catch(() => undefined);
  } catch {
    // Observability must never alter the user request path.
  }
}

export function recordOfflineShellTelemetry(input: {
  conflictCount?: number;
  networkQuality?: ClientTelemetryNetworkQuality;
  pendingCount?: number;
  state: OfflineShellTelemetryState;
  timestamp?: number;
}) {
  const state = normalizeOfflineShellState(input.state);
  recordClientTelemetry({
    conflictCount: input.conflictCount,
    durationMs: 0,
    kind: "offline-shell",
    method: state,
    name: "offline-shell",
    networkQuality: normalizeOfflineNetworkQuality(input.networkQuality),
    outcome: state === "failed" ? "error" : "success",
    pendingCount: input.pendingCount,
    timestamp: input.timestamp ?? Date.now(),
  });
}

export function getClientTelemetrySnapshot() {
  return events.map((event) => ({ ...event }));
}

export function summarizeClientTelemetry(source: readonly ClientTelemetryEvent[] = events): ClientTelemetrySummary[] {
  const groups = new Map<string, ClientTelemetryEvent[]>();
  for (const event of source) {
    const key = [event.kind, event.name, event.method ?? "", event.portal ?? ""].join("|");
    const group = groups.get(key);
    if (group) group.push(event);
    else groups.set(key, [event]);
  }

  return Array.from(groups.values())
    .map((group) => {
      const first = group[0] as ClientTelemetryEvent;
      const durations = group.map((event) => event.durationMs).sort((left, right) => left - right);
      const errorCount = group.filter((event) => event.outcome === "error" || event.outcome === "timeout").length;
      return {
        averageDurationMs: roundMetric(durations.reduce((total, duration) => total + duration, 0) / group.length),
        cancelledCount: group.filter((event) => event.outcome === "cancelled").length,
        errorCount,
        errorRate: roundMetric(errorCount / group.length),
        kind: first.kind,
        method: first.method,
        name: first.name,
        p95DurationMs: durations[Math.max(0, Math.ceil(durations.length * 0.95) - 1)] ?? 0,
        partialCount: group.filter((event) => event.outcome === "partial").length,
        portal: first.portal,
        requestCount: group.length,
      };
    })
    .sort((left, right) => right.requestCount - left.requestCount || left.name.localeCompare(right.name));
}

export function clearClientTelemetry() {
  events.length = 0;
}

export function setClientTelemetrySink(nextSink: ClientTelemetrySink | null) {
  sink = nextSink;
}

function isObviouslyDynamicSegment(segment: string) {
  return /^\d+$/.test(segment)
    || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment)
    || segment.length > 48;
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeDuration(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(600_000, Math.max(0, value)) * 100) / 100;
}

function roundMetric(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

function normalizeOutcome(value: ClientTelemetryOutcome): ClientTelemetryOutcome {
  return ["cancelled", "error", "partial", "success", "timeout"].includes(value) ? value : "error";
}

function normalizeTelemetryKind(value: ClientTelemetryKind) {
  return value === "graphql" || value === "offline-shell" ? value : "rest";
}

function normalizeNetworkQuality(value?: ClientTelemetryNetworkQuality) {
  return value && ["degraded", "offline", "online"].includes(value) ? value : undefined;
}

function normalizeOfflineNetworkQuality(value?: ClientTelemetryNetworkQuality) {
  return normalizeNetworkQuality(value) ?? "online";
}

function normalizeOfflineShellState(value: OfflineShellTelemetryState) {
  return ["conflict", "degraded", "failed", "offline", "online", "pending"].includes(value) ? value : "online" as const;
}

function normalizeQueueCount(value?: number) {
  if (!Number.isFinite(value)) return undefined;
  return Math.min(500, Math.max(0, Math.floor(value as number)));
}

function normalizePortal(value?: ClientTelemetryPortal) {
  return value && ["admin", "crm", "elearning", "lcms", "lms"].includes(value) ? value : undefined;
}

function normalizeStatus(value?: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 599 ? value : undefined;
}

function normalizeOptionalLabel(value?: string, maxLength = 80) {
  if (!value) return undefined;
  const normalized = value.trim().slice(0, maxLength);
  return /^[A-Za-z0-9_.:-]+$/.test(normalized) ? normalized : undefined;
}

function readString(value: unknown, key: string) {
  if (!value || typeof value !== "object" || !(key in value)) return undefined;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" ? candidate : undefined;
}
