import { useState } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { DashboardGroup } from "@/layouts/dashboard/types/dashboard-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

type NavMainProps = {
  activeLeafId: string;
  collapsed: boolean;
  items: Array<DashboardGroup & { icon: React.ReactNode }>;
  onSelectLeaf: (leafId: string) => void;
};

export function NavMain({ activeLeafId, collapsed, items, onSelectLeaf }: NavMainProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  return (
    <List aria-label="Các nhóm chức năng" disablePadding sx={{ display: "grid", gap: 0.75 }}>
      {items.map((item) => {
        const firstLeafId = item.items[0]?.id;
        const groupActive = item.items.some((leaf) => leaf.id === activeLeafId);
        const expanded = !collapsed && (openGroups[item.title] ?? groupActive);

        if (collapsed) {
          return (
            <Tooltip key={item.title} placement="right" title={item.title}>
              <ListItemButton
                aria-label={item.title}
                onClick={() => firstLeafId && onSelectLeaf(firstLeafId)}
                selected={groupActive}
                sx={{
                  borderRadius: 2,
                  justifyContent: "center",
                  minHeight: 48,
                  px: 1,
                  "&.Mui-selected": { bgcolor: ergEnterpriseTokens.color.primarySoft, color: "primary.main" },
                }}
              >
                <ListItemIcon sx={{ color: "inherit", justifyContent: "center", minWidth: 0 }}>
                  {item.icon}
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          );
        }

        const isSingleLeaf = item.items.length === 1;
        return (
          <Box key={item.title} component="li" sx={{ listStyle: "none" }}>
            <ListItemButton
              aria-expanded={isSingleLeaf ? undefined : expanded}
              onClick={() => {
                if (isSingleLeaf && firstLeafId) {
                  onSelectLeaf(firstLeafId);
                  return;
                }
                setOpenGroups((current) => ({ ...current, [item.title]: !expanded }));
              }}
              selected={groupActive}
              sx={{
                border: "1px solid transparent",
                borderRadius: 2,
                color: groupActive ? "primary.main" : "text.secondary",
                minHeight: 44,
                px: 1.25,
                "&.Mui-selected": { bgcolor: ergEnterpriseTokens.color.primarySofter },
                "&.Mui-selected:hover": { bgcolor: ergEnterpriseTokens.color.primarySoft },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 36, "& .MuiSvgIcon-root": { fontSize: 20 } }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                slotProps={{ primary: { sx: { fontSize: 14, fontWeight: groupActive ? 750 : 650 } } }}
              />
              {!isSingleLeaf ? (
                <ExpandMoreRoundedIcon
                  sx={{
                    fontSize: 18,
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 180ms ease",
                  }}
                />
              ) : null}
            </ListItemButton>

            {!isSingleLeaf ? (
              <Collapse in={expanded} timeout={180} unmountOnExit>
                <List disablePadding sx={{ borderLeft: "1px solid", borderColor: "divider", ml: 2.75, mt: 0.5, pl: 1 }}>
                  {item.items.map((leaf) => {
                    const active = leaf.id === activeLeafId;
                    return (
                      <ListItemButton
                        aria-current={active ? "page" : undefined}
                        key={leaf.id}
                        onClick={() => onSelectLeaf(leaf.id)}
                        selected={active}
                        sx={{
                          borderRadius: 1.5,
                          color: active ? "primary.main" : "text.secondary",
                          minHeight: 36,
                          px: 1.25,
                          "&.Mui-selected": { bgcolor: ergEnterpriseTokens.color.primarySofter },
                        }}
                      >
                        <ListItemText
                          primary={leaf.title}
                          slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: active ? 750 : 600 } } }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            ) : null}
          </Box>
        );
      })}
    </List>
  );
}
