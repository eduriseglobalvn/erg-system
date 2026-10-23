import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import { DashboardAccountCard } from "@/layouts/dashboard/components/dashboard-account-card";
import type { DashboardGroup, DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function DashboardSidebar({
  groups,
  activeLeaf,
  onSelect,
}: {
  groups: DashboardGroup[];
  activeLeaf: DashboardLeaf;
  onSelect: (id: string) => void;
}) {
  return (
    <Box
      aria-label="Điều hướng chính"
      component="nav"
      data-sidebar-width={ergEnterpriseTokens.size.sidebar}
      sx={{
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
        width: ergEnterpriseTokens.size.sidebar,
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, py: 2.5 }}>
        {groups.map((group) => (
          <List
            disablePadding
            key={group.title}
            subheader={
              <ListSubheader
                disableGutters
                disableSticky
                sx={{
                  bgcolor: "transparent",
                  color: "text.secondary",
                  fontSize: 12,
                  fontWeight: 750,
                  lineHeight: "28px",
                  px: 1,
                }}
              >
                {group.title}
              </ListSubheader>
            }
            sx={{ mb: 2 }}
          >
            <Box sx={{ borderLeft: "1px solid", borderColor: "divider", display: "grid", gap: 0.5, pl: 1.5 }}>
              {group.items.map((item) => {
                const isActive = item.id === activeLeaf.id;

                return (
                  <ListItemButton
                    aria-current={isActive ? "page" : undefined}
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    selected={isActive}
                    sx={{
                      border: "1px solid transparent",
                      borderRadius: 2,
                      color: isActive ? "primary.main" : "text.secondary",
                      minHeight: 38,
                      px: 1.5,
                      py: 0.75,
                      position: "relative",
                      "&::before": isActive
                        ? {
                            bgcolor: "primary.main",
                            borderRadius: "0 4px 4px 0",
                            bottom: 7,
                            content: '""',
                            left: -13,
                            position: "absolute",
                            top: 7,
                            width: 3,
                          }
                        : undefined,
                      "&.Mui-selected": {
                        bgcolor: ergEnterpriseTokens.color.primarySofter,
                        borderColor: "divider",
                        color: "primary.main",
                      },
                      "&.Mui-selected:hover": { bgcolor: ergEnterpriseTokens.color.primarySofter },
                      "&:hover": {
                        bgcolor: "action.hover",
                        borderColor: "divider",
                        color: "text.primary",
                      },
                    }}
                  >
                    <ListItemText
                      primary={item.title}
                      slotProps={{ primary: { sx: { fontSize: 14, fontWeight: isActive ? 750 : 650 } } }}
                    />
                  </ListItemButton>
                );
              })}
            </Box>
          </List>
        ))}
      </Box>

      <DashboardAccountCard />
    </Box>
  );
}
