import Chip from "@mui/material/Chip";
import type { ContentLifecycleState } from "@/features/lcms/content-lifecycle/types/content-lifecycle-types";
import { lifecycleStateLabel } from "@/features/lcms/content-lifecycle/types/content-lifecycle-types";

export function ContentLifecycleStateChip({ state }: { state: ContentLifecycleState | null }) {
  const color = state === "PUBLISHED"
    ? "success"
    : state === "APPROVED"
      ? "info"
      : state === "IN_REVIEW"
        ? "warning"
        : state === "ARCHIVED"
          ? "error"
          : "default";
  return <Chip color={color} label={lifecycleStateLabel(state)} size="small" variant={state === "PUBLISHED" ? "filled" : "outlined"} />;
}

