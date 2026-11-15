import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useNavigate } from "@tanstack/react-router";

import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { useMyTeachingMonth } from "../api/teaching-hours-query";
import { hasTeaching } from "../domain/teaching-model";

export type MyCongTab = "days" | "periods";

/** «Ngày công | Tiết dạy» switch of «Công của tôi». «Tiết dạy» only shows for someone who has teaching periods that month. */
export function MyCongTabs({ period, tab }: { period: string; tab: MyCongTab }) {
  const navigate = useNavigate();
  const { data } = useMyTeachingMonth(period);
  if (tab === "days" && !hasTeaching(data)) return null;
  return (
    <Tabs
      aria-label="Công của tôi"
      onChange={(_, next: MyCongTab) => void navigate({ href: teacherPath(`/timekeeping/timesheet?tab=${next}&period=${period}`), replace: true })}
      sx={{ borderBottom: 1, borderColor: "divider" }}
      value={tab}
      variant="fullWidth"
    >
      <Tab label="Ngày công" value="days" />
      <Tab label="Tiết dạy" value="periods" />
    </Tabs>
  );
}
