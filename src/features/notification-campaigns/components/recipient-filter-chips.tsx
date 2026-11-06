import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

import type { RecipientCard } from "../api/campaign-types";

export type RecipientFilter = "ALL" | "STUDENT" | "TEACHER" | "STAFF" | "ERRORS";

type Props = { active: RecipientFilter; errorCount: number; onChange: (f: RecipientFilter) => void; picked: RecipientCard[] };

/** No parent chip: parents are not supported. Staff / error chips only appear when there is someone to show. */
export function RecipientFilterChips({ active, errorCount, onChange, picked }: Props) {
  const count = (role: string) => picked.filter((c) => c.role === role).length;
  const chips: Array<[RecipientFilter, string, number]> = [
    ["ALL", "Tất cả", picked.length],
    ["STUDENT", "HS", count("STUDENT")],
    ["TEACHER", "GV", count("TEACHER")],
    ["STAFF", "NV", count("STAFF")],
    ["ERRORS", "Lỗi", errorCount],
  ];
  return (
    <Stack aria-label="Lọc người nhận" direction="row" role="group" sx={{ flexWrap: "wrap", gap: 1 }}>
      {chips.map(([key, label, n]) =>
        key === "ALL" || n > 0 ? (
          <Chip
            aria-pressed={active === key}
            clickable
            color={active === key ? "primary" : "default"}
            key={key}
            label={`${label} ${n}`}
            onClick={() => onChange(key)}
            variant={active === key ? "filled" : "outlined"}
          />
        ) : null,
      )}
    </Stack>
  );
}
