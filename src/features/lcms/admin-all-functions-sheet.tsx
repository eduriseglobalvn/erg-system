import { useMemo, useState, type ReactNode } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgDialog, ErgTextField } from "@/components/erg-mui";
import type { MenuGroup, MenuItem } from "@/components/portal/ErgPortalLayout";
import { filterAdminMenuGroups } from "@/features/lcms/admin-mobile-dock-config";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { radius, size } = ergEnterpriseTokens;

function matches(item: MenuItem, query: string) {
  return item.label.toLocaleLowerCase("vi-VN").includes(query);
}

/** Keeps leaves whose own label matches, or every leaf under a matching parent. */
function searchGroups(groups: MenuGroup[], query: string): MenuGroup[] {
  if (!query) return groups;
  return groups.flatMap((group) => {
    const items = group.items.flatMap((item): MenuItem[] => {
      if (!item.children?.length) return matches(item, query) ? [item] : [];
      if (matches(item, query)) return [item];
      const children = item.children.filter((child) => matches(child, query));
      return children.length ? [{ ...item, children }] : [];
    });
    return items.length ? [{ ...group, items }] : [];
  });
}

/** Full-screen "Tất cả chức năng" sheet for the admin dock: every sidebar destination the session may open. */
export function AdminAllFunctionsSheet({
  canAccess,
  menuGroups,
  onClose,
  onNavigate,
  open,
}: {
  canAccess: (path: string) => boolean;
  menuGroups: MenuGroup[];
  onClose: () => void;
  onNavigate: (path: string) => void;
  open: boolean;
}) {
  const [search, setSearch] = useState("");
  const allowed = useMemo(() => filterAdminMenuGroups(menuGroups, canAccess), [canAccess, menuGroups]);
  const visible = useMemo(() => searchGroups(allowed, search.trim().toLocaleLowerCase("vi-VN")), [allowed, search]);

  function go(path: string) {
    onClose();
    onNavigate(path);
  }

  return (
    <ErgDialog
      fullScreen
      onClose={onClose}
      open={open}
      sx={{ "& .MuiDialog-paper": { borderRadius: `${radius.shell}px ${radius.shell}px 0 0` } }}
      title="Tất cả chức năng"
    >
      <Stack spacing={2}>
        <ErgTextField
          compact
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm chức năng"
          slotProps={{ htmlInput: { "aria-label": "Tìm chức năng" } }}
          type="search"
          value={search}
        />
        {visible.length === 0 ? (
          <Typography color="text.secondary" variant="body2">Không tìm thấy chức năng phù hợp.</Typography>
        ) : null}
        {visible.map((group, index) => (
          <Stack key={`${group.label}-${index}`} spacing={1}>
            {group.label ? <Typography color="text.secondary" variant="caption">{group.label}</Typography> : null}
            {group.items.map((item) =>
              item.children?.length ? (
                <Stack key={item.id ?? item.label} spacing={0.5}>
                  <Typography sx={{ alignItems: "center", display: "flex", gap: 1, typography: "subtitle2" }}>
                    {item.icon}
                    {item.label}
                  </Typography>
                  {item.children.map((child) => (
                    <Row indent key={child.id ?? child.path ?? child.label} label={child.label} onClick={() => go(child.path!)} />
                  ))}
                </Stack>
              ) : (
                <Row icon={item.icon} key={item.id ?? item.path ?? item.label} label={item.label} onClick={() => go(item.path!)} />
              ),
            )}
          </Stack>
        ))}
      </Stack>
    </ErgDialog>
  );
}

function Row({ icon, indent = false, label, onClick }: { icon?: ReactNode; indent?: boolean; label: string; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: `${radius.card}px`,
        gap: 1.5,
        justifyContent: "flex-start",
        minHeight: size.controlLg,
        ml: indent ? 3 : 0,
        px: 1.5,
        textAlign: "left",
        typography: "body2",
      }}
    >
      {icon}
      {label}
    </ButtonBase>
  );
}
