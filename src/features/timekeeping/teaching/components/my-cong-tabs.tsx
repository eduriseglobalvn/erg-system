import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useNavigate } from "@tanstack/react-router";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { useMyTeachingMonth } from "../api/teaching-hours-query";
import { hasTeaching } from "../domain/teaching-model";

export type MyCongTab = "days" | "periods";

const tab = { color: t.color.textSecondary, fontWeight: "fontWeightRegular", minHeight: t.size.controlMd, minWidth: 0, px: 2, py: 0, textTransform: "none", "&.Mui-selected": { fontWeight: t.type.label.fontWeight } } as const;

/** «Ngày công | Tiết dạy» switch of «Công của tôi». «Tiết dạy» only shows for someone who has teaching periods that month.
 *  Desktop board: tabs hug their text on the left; phone board: two equal tabs 44 high. */
export function MyCongTabs({ mobile = false, period, tab: active }: { mobile?: boolean; period: string; tab: MyCongTab }) {
  const navigate = useNavigate();
  const { data } = useMyTeachingMonth(period);
  if (active === "days" && !hasTeaching(data)) return null;
  const height = mobile ? 44 : t.size.controlMd;
  return (
    <Tabs
      aria-label="Công của tôi"
      onChange={(_, next: MyCongTab) => void navigate({ href: teacherPath(`/timekeeping/timesheet?tab=${next}&period=${period}`), replace: true })}
      sx={{ borderBottom: 1, borderColor: "divider", minHeight: height, "& .MuiTab-root": { ...tab, minHeight: height, ...(mobile ? { flex: 1, maxWidth: "none" } : null) } }}
      value={active}
    >
      <Tab label="Ngày công" value="days" />
      <Tab label="Tiết dạy" value="periods" />
    </Tabs>
  );
}
