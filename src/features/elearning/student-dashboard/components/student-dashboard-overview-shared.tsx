import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import type { DashboardCopy, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { OverviewHero } from "@/features/elearning/student-dashboard/utils/student-overview-hero";

/** Hero CTAs: never a disabled primary next to a live secondary; without a primary the secondary is the contained button. */
export function OverviewHeroActions({
  copy,
  fullWidth = false,
  hero,
  onOpenAssignment,
  onPageChange,
}: {
  copy: DashboardCopy;
  fullWidth?: boolean;
  hero: OverviewHero;
  onOpenAssignment: (assignmentId: string) => void;
  onPageChange: (page: StudentPageKey) => void;
}) {
  const { primaryAssignmentId } = hero;
  return (
    <Stack direction={fullWidth ? "column" : "row"} spacing={1.25} sx={{ flexWrap: "wrap", rowGap: 1 }}>
      {primaryAssignmentId ? (
        <Button fullWidth={fullWidth} onClick={() => onOpenAssignment(primaryAssignmentId)} sx={{ minHeight: 44 }} variant="contained">
          {copy.primaryAction}
        </Button>
      ) : null}
      <Button fullWidth={fullWidth} onClick={() => onPageChange("assignments")} sx={{ minHeight: 44 }} variant={hero.secondaryVariant}>
        {copy.secondaryAction}
      </Button>
    </Stack>
  );
}
