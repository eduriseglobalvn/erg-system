import { useNavigate, useSearch } from "@tanstack/react-router";

import { adminPath } from "@/platform/workspaces/workspace-paths";

type AdminSearch = { schoolId?: string; date?: string; period?: string };

const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);

/** `?schoolId=&date=&period=` of an admin screen; ids and dates only, nothing personal. Updates replace the history entry. */
export function useAdminSearch(path: string) {
  const raw = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();
  const search: AdminSearch = { schoolId: text(raw.schoolId), date: text(raw.date), period: text(raw.period) };
  const update = (patch: AdminSearch) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...search, ...patch })) if (value) next.set(key, value);
    const query = next.toString();
    void navigate({ href: adminPath(query ? `${path}?${query}` : path), replace: true });
  };
  return { search, update };
}
