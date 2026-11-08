import { useMemo, useState, type ReactNode } from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";

import { ErgDialog, ErgTextField } from "@/components/erg-mui";
import type { MenuGroup, MenuItem } from "@/components/portal/ErgPortalLayout";
import {
  ErgSheetIdentity,
  ErgSheetSignOut,
  ErgSheetTileGroup,
  ErgWorkspaceSwitch,
  type ErgSheetTileItem,
  type ErgSheetTileTone,
  type ErgWorkspaceOption,
} from "@/components/portal/erg-mobile-sheet-parts";
import { filterAdminMenuGroups } from "@/features/lcms/admin-mobile-dock-config";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { radius, size } = ergEnterpriseTokens;

// Tile tint per section, as in design N5 (staff/timekeeping green, system grey).
const SECTION_TONE: Record<string, ErgSheetTileTone> = {
  "Nhân sự": "success",
  "Chấm công": "success",
  "Quyền & nhóm quyền": "neutral",
  "Tích hợp": "neutral",
};

type Section = { label: string; items: ErgSheetTileItem[] };

/** Leaves under an item, each carrying the nearest icon above it. */
function leaves(item: MenuItem, icon: ReactNode, tone?: ErgSheetTileTone): ErgSheetTileItem[] {
  const ownIcon = item.icon ?? icon;
  if (!item.children?.length) {
    if (!item.path) return [];
    // Menu badges are counts ("7") or labels ("beta"); labels render as a tag under the tile name.
    const count = item.badge && /^\d+$/.test(item.badge) ? item.badge : undefined;
    return [{ badge: count, icon: ownIcon, label: item.label, path: item.path, tag: count ? undefined : item.badge, tone }];
  }
  return item.children.flatMap((child) => leaves(child, ownIcon, tone));
}

/** Top-level leaves group under their menu group ("Tổng quan" when unnamed); each branch becomes its own section. */
export function toSections(groups: MenuGroup[]): Section[] {
  const sections: Section[] = [];
  const add = (label: string, items: ErgSheetTileItem[]) => {
    if (!items.length) return;
    const existing = sections.find((section) => section.label === label);
    if (existing) existing.items.push(...items);
    else sections.push({ items, label });
  };
  for (const group of groups) {
    add(group.label || "Tổng quan", group.items.filter((item) => !item.children?.length).flatMap((item) => leaves(item, null)));
    for (const item of group.items.filter((entry) => entry.children?.length)) add(item.label, leaves(item, null, SECTION_TONE[item.label]));
  }
  return sections;
}

function searchSections(sections: Section[], query: string): Section[] {
  if (!query) return sections;
  return sections.flatMap((section) => {
    if (section.label.toLocaleLowerCase("vi-VN").includes(query)) return [section];
    const items = section.items.filter((item) => item.label.toLocaleLowerCase("vi-VN").includes(query));
    return items.length ? [{ ...section, items }] : [];
  });
}

/** Design N5 "Tất cả chức năng": identity, search, tile sections, workspace switch and sign out. */
export function AdminAllFunctionsSheet({
  account,
  canAccess,
  menuGroups,
  onClose,
  onNavigate,
  onSignOut,
  open,
  workspaces = [],
}: {
  account?: { email: string; name: string };
  canAccess: (path: string) => boolean;
  menuGroups: MenuGroup[];
  onClose: () => void;
  onNavigate: (path: string) => void;
  onSignOut?: () => void;
  open: boolean;
  workspaces?: ErgWorkspaceOption[];
}) {
  const [search, setSearch] = useState("");
  const sections = useMemo(() => toSections(filterAdminMenuGroups(menuGroups, canAccess)), [canAccess, menuGroups]);
  const visible = useMemo(() => searchSections(sections, search.trim().toLocaleLowerCase("vi-VN")), [sections, search]);

  function close() {
    setSearch("");
    onClose();
  }

  function go(path: string) {
    close();
    onNavigate(path);
  }

  return (
    <ErgDialog
      fullScreen
      onClose={close}
      open={open}
      sx={{ "& .MuiDialog-paper": { borderRadius: `${radius.shell}px ${radius.shell}px 0 0` } }}
      title="Tất cả chức năng"
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
        {account ? (
          <ErgSheetIdentity badges={["Admin LMS"]} email={account.email} initials={initials(account.name)} name={account.name} primaryAvatar />
        ) : null}
        <ErgTextField
          compact
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm chức năng, ví dụ “duyệt đơn”"
          slotProps={{
            htmlInput: { "aria-label": "Tìm chức năng" },
            input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: "text.secondary", fontSize: size.iconMd }} /></InputAdornment> },
          }}
          type="search"
          value={search}
        />
        {visible.length === 0 ? (
          <Typography color="text.secondary" variant="body2">Không tìm thấy chức năng phù hợp.</Typography>
        ) : null}
        {visible.map((section) => <ErgSheetTileGroup items={section.items} key={section.label} label={section.label} onNavigate={go} />)}
        <ErgWorkspaceSwitch onNavigate={go} options={workspaces} />
        {onSignOut ? <ErgSheetSignOut onSignOut={() => { close(); onSignOut(); }} /> : null}
      </Box>
    </ErgDialog>
  );
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0]?.slice(0, 2) ?? "A").toUpperCase();
}
