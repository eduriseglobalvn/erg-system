import { useNavigate, useSearch } from "@tanstack/react-router";

import { adminPath } from "@/platform/workspaces/workspace-paths";
import type { ApprovalTab } from "./approval-model";

export const APPROVALS_PATH = "/employees/teacher-absence";

export type ApprovalsSearch = { tab: ApprovalTab; type?: string; schoolId?: string; due?: string; id?: string };

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

/** `?tab=&type=&schoolId=&due=&id=` of A03: ids and enums only. Opening or closing a request pushes history (mobile back button); filters replace it. */
export function useApprovalsSearch(canSeeAll: boolean) {
  const raw = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();
  const tab: ApprovalTab = raw.tab === "done" ? "done" : raw.tab === "all" && canSeeAll ? "all" : "mine";
  const search: ApprovalsSearch = { tab, type: text(raw.type), schoolId: text(raw.schoolId), due: text(raw.due), id: text(raw.id) };
  const update = (patch: Partial<ApprovalsSearch>, push = false) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...search, ...patch })) if (value && !(key === "tab" && value === "mine")) next.set(key, value);
    const query = next.toString();
    void navigate({ href: adminPath(query ? `${APPROVALS_PATH}?${query}` : APPROVALS_PATH), replace: !push });
  };
  return { search, update };
}
