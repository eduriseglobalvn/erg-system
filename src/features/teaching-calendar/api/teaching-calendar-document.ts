import fragmentsDocument from "./graphql/teaching-calendar-fragments.graphql?raw";
import { ApiClientError } from "@/lib/api-client/errors";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";

const FRAGMENT_BLOCK = /^fragment\s+(\w+)\s+on[\s\S]*?^}$/gm;
const fragmentBlocks = new Map<string, string>(
  [...fragmentsDocument.matchAll(FRAGMENT_BLOCK)].map((match) => [match[1], match[0]]),
);

/** Appends only the shared fragments the document uses (GraphQL rejects unused fragments). */
export function withTeachingCalendarFragments(document: string): string {
  const needed = new Set<string>();
  const pending = [document];
  for (let source = pending.pop(); source !== undefined; source = pending.pop()) {
    for (const match of source.matchAll(/\.\.\.\s*(\w+)/g)) {
      const block = fragmentBlocks.get(match[1]);
      if (block && !needed.has(match[1])) {
        needed.add(match[1]);
        pending.push(block);
      }
    }
  }
  return [document, ...[...needed].map((name) => fragmentBlocks.get(name) as string)].join("\n");
}

/** `extensions.code` of the first GraphQL error (STALE_VERSION, BATCH_LABEL_TAKEN, ...), else the client error code. */
export function teachingScheduleErrorCode(error: unknown): string | undefined {
  if (!(error instanceof ApiClientError)) return undefined;
  if (Array.isArray(error.details)) {
    for (const item of error.details as Array<{ extensions?: { code?: unknown } }>) {
      const code = item?.extensions?.code;
      if (typeof code === "string") return code;
    }
  }
  return error.code;
}

/** One operation of a per-feature document: GraphQL picks it by operationName. */
export function requestTeachingCalendar<TData, TVariables extends Record<string, unknown>>(
  document: string,
  { operationName, signal, variables }: { operationName: string; signal?: AbortSignal; variables?: TVariables },
) {
  return graphQlRequest<TData, TVariables>({
    operationName,
    portal: "lcms",
    query: withTeachingCalendarFragments(document),
    signal,
    tenantId: getDefaultTenantId(),
    variables,
  });
}
