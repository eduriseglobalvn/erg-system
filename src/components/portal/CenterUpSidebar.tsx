"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  ClickAwayListener,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  SvgIcon,
  Typography,
} from "@mui/material";
import { ERG_ASSETS } from "@/config/seo";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import { useLocation } from "../../routes/router-compat";
import type { MenuGroup, MenuItem, PortalInfo } from "./CenterUpLayout";

const EXPANDED_SIDEBAR_WIDTH = 236;
const COLLAPSED_SIDEBAR_WIDTH = 72;
const NAV_BLUE = "#0F6CBD";
const NAV_RED = "#F35C6B";
const NAV_ITEM_COLOR = "#425264";
const NAV_TEXT_COLOR = "#1C252E";
const NAV_MUTED_COLOR = "#667789";
const NAV_PRIMARY = "#3659BB";
const NAV_SURFACE_BG = "rgba(250,252,255,0.985)";
const NAV_SUBTLE_GLASS_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 100%), linear-gradient(135deg, rgba(56,145,246,0.08) 0%, rgba(109,115,226,0.08) 52%, rgba(244,103,121,0.07) 100%)";
const NAV_PREVIEW_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.78) 100%), linear-gradient(135deg, rgba(15,108,189,0.06) 0%, rgba(103,111,225,0.05) 48%, rgba(243,92,107,0.045) 100%)";
const NAV_HOVER_BG = `linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.68) 100%), linear-gradient(135deg, color-mix(in srgb, ${NAV_BLUE} 7%, transparent) 0%, rgba(110,116,225,0.07) 50%, color-mix(in srgb, ${NAV_RED} 6%, transparent) 100%)`;
const NAV_ACTIVE_BG = `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.84) 100%), linear-gradient(135deg, color-mix(in srgb, ${NAV_BLUE} 17%, transparent) 0%, rgba(102,111,225,0.16) 48%, color-mix(in srgb, ${NAV_RED} 14%, transparent) 100%)`;
const NAV_ACTIVE_BORDER = "rgba(108, 122, 205, 0.22)";
const NAV_PREVIEW_BORDER = "rgba(145,158,171,0.18)";
const NAV_ACTIVE_SHADOW =
  "inset 0 1px 0 rgba(255,255,255,0.84), 0 8px 18px rgba(94, 108, 187, 0.1)";
const NAV_PANEL_BG = `radial-gradient(136% 118% at 0% 0%, color-mix(in srgb, ${NAV_BLUE} 8%, transparent) 0%, rgba(15,108,189,0.03) 16%, rgba(15,108,189,0) 44%), radial-gradient(120% 116% at 100% 10%, color-mix(in srgb, ${NAV_RED} 7%, transparent) 0%, rgba(243,92,107,0.025) 16%, rgba(243,92,107,0) 40%), linear-gradient(180deg, rgba(255,255,255,0.992) 0%, rgba(250,251,254,0.99) 54%, rgba(247,249,253,0.992) 100%)`;
const NAV_PANEL_BORDER = "rgba(136, 145, 188, 0.16)";
const NAV_PANEL_SHADOW =
  "10px 0 24px rgba(115, 126, 173, 0.08), inset -1px 0 0 rgba(255,255,255,0.7), inset 0 1px 0 rgba(255,255,255,0.84)";
const NAV_BUTTON_BG = NAV_SUBTLE_GLASS_BG;
const SIDEBAR_MOTION_MS = 300;
const SIDEBAR_LAYOUT_SWAP_MS = 210;
const SIDEBAR_MOTION_CURVE = `${SIDEBAR_MOTION_MS}ms cubic-bezier(0.24, 0.9, 0.32, 1)`;
const SIDEBAR_WIDTH_TRANSITION = `width ${SIDEBAR_MOTION_CURVE}`;
const SIDEBAR_FADE_EASING = "180ms cubic-bezier(0.32, 0.72, 0, 1)";
const SUBMENU_MOTION_EASING = "240ms cubic-bezier(0.24, 0.9, 0.32, 1)";
const TREE_CONNECTOR_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 14 14'%3E%3Cpath d='M1 1v4a8 8 0 0 0 8 8h4' stroke='%23efefef' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E\") 50% 50% / 100% no-repeat";

const COLLAPSED_LABELS: Record<string, string> = {
  "Lịch toàn trung tâm": "Lịch toàn tr...",
  "Bài tập & tài liệu": "Bài tập & tài...",
  "Quản lý học liệu": "Quản lý...",
};

function normalizedLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isReportMenu(label: string) {
  return normalizedLabel(label).includes("bao cao");
}

function isStudentLabel(label: string) {
  return normalizedLabel(label).includes("hoc vien");
}

function getCollapsedLabel(label: string) {
  return COLLAPSED_LABELS[label] ?? label;
}

function pathMatches(path: string | undefined, currentPath: string, allowPrefix = false) {
  if (!path) return false;
  if (path === currentPath) return true;
  if (!allowPrefix || path === "/") return false;
  return currentPath.startsWith(`${path}/`);
}

interface SidebarProps {
  collapsed: boolean;
  menuGroups: MenuGroup[];
  portalInfo?: PortalInfo;
  onCollapsedChange: (collapsed: boolean) => void;
  onNavigate: (path: string) => void;
}

export default function CenterUpSidebar({
  collapsed,
  menuGroups,
  portalInfo,
  onCollapsedChange,
  onNavigate,
}: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const sidebarWidth = collapsed
    ? COLLAPSED_SIDEBAR_WIDTH
    : EXPANDED_SIDEBAR_WIDTH;
  const [renderCollapsedLayout, setRenderCollapsedLayout] = useState(collapsed);
  const [sidebarTransitioning, setSidebarTransitioning] = useState(false);
  const [sidebarMotionState, setSidebarMotionState] = useState<
    "idle" | "collapsing" | "expanding"
  >("idle");
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      setRenderCollapsedLayout(collapsed);
      return;
    }

    const timers: number[] = [];

    timers.push(
      window.setTimeout(() => {
        setSidebarTransitioning(true);

        if (collapsed) {
          setSidebarMotionState("collapsing");
          timers.push(
            window.setTimeout(
              () => setRenderCollapsedLayout(true),
              SIDEBAR_LAYOUT_SWAP_MS,
            ),
          );
        } else {
          setSidebarMotionState("expanding");
          setRenderCollapsedLayout(false);
        }

        timers.push(
          window.setTimeout(() => {
            setSidebarTransitioning(false);
            setSidebarMotionState("idle");
            setRenderCollapsedLayout(collapsed);
          }, SIDEBAR_MOTION_MS),
        );
      }, 0),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [collapsed]);

  const navMotionTransform =
    sidebarMotionState === "collapsing"
      ? "translateX(-2px)"
      : sidebarMotionState === "expanding"
        ? "translateX(2px)"
        : "translateX(0)";
  const renderedCollapsed = renderCollapsedLayout;
  const normalizedPortalName = normalizedLabel(portalInfo?.name ?? "");
  const hideSidebarBottom =
    normalizedPortalName.includes("lms") ||
    normalizedPortalName.includes("lcms");

  return (
    <Drawer
      variant="permanent"
      sx={{
        flexShrink: 0,
        transition: SIDEBAR_WIDTH_TRANSITION,
        width: sidebarWidth,
        "& .MuiDrawer-paper": {
          backgroundColor: NAV_SURFACE_BG,
          backgroundImage: NAV_PANEL_BG,
          backdropFilter: "blur(6px) saturate(108%)",
          WebkitBackdropFilter: "blur(6px) saturate(108%)",
          border: "none",
          borderRadius: 0,
          borderRight: `1px solid ${NAV_PANEL_BORDER}`,
          boxSizing: "border-box",
          boxShadow: NAV_PANEL_SHADOW,
          color: NAV_ITEM_COLOR,
          display: "flex",
          flexDirection: "column",
          overflow: "visible",
          position: "relative",
          transition: SIDEBAR_WIDTH_TRANSITION,
          willChange: "width",
          width: sidebarWidth,
          zIndex: 1301,
          "&::before": {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0) 42%), linear-gradient(135deg, rgba(42,147,242,0.02) 0%, rgba(243,92,107,0.02) 100%)",
            content: '""',
            inset: 0,
            pointerEvents: "none",
            position: "absolute",
          },
          "&::after": {
            background:
              "linear-gradient(112deg, rgba(255,255,255,0) 24%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.05) 49%, rgba(255,255,255,0) 62%)",
            content: '""',
            inset: 0,
            opacity: 0.3,
            pointerEvents: "none",
            position: "absolute",
          },
        },
      }}
    >
      <IconButton
        aria-label={collapsed ? "Mo rong menu" : "Thu gon menu"}
        disableRipple
        onClick={() => onCollapsedChange(!collapsed)}
        size="small"
        sx={{
          background: NAV_BUTTON_BG,
          border: `1px solid ${NAV_ACTIVE_BORDER}`,
          boxShadow:
            "0 8px 16px rgba(94,108,187,0.1), inset 0 1px 0 rgba(255,255,255,0.78)",
          color: NAV_ITEM_COLOR,
          height: 26,
          position: "absolute",
          right: -13,
          top: 20,
          width: 26,
          zIndex: 1300,
          "&:hover": {
            background: NAV_ACTIVE_BG,
            borderColor: NAV_ACTIVE_BORDER,
            color: NAV_PRIMARY,
          },
        }}
      >
        {collapsed ? (
          <KeyboardArrowRightRoundedIcon sx={{ fontSize: 18 }} />
        ) : (
          <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
        )}
      </IconButton>

      <Box
        sx={{
          boxSizing: "border-box",
          display: "flex",
          height: 68,
          justifyContent: renderedCollapsed ? "center" : "flex-start",
          pl: renderedCollapsed ? 0 : "16px",
          pt: "20px",
          position: "relative",
          transform: navMotionTransform,
          transformOrigin: "left top",
          transition: `padding ${SIDEBAR_MOTION_CURVE}, opacity ${SIDEBAR_FADE_EASING}, transform ${SUBMENU_MOTION_EASING}`,
          opacity: sidebarTransitioning ? 0.98 : 1,
          willChange: "transform, opacity",
          zIndex: 1,
        }}
      >
        <Box
          component="button"
          aria-label="Logo"
          onClick={() => onNavigate("/")}
          sx={{
            alignItems: "center",
            appearance: "none",
            bgcolor: "transparent",
            border: 0,
            cursor: "pointer",
            display: "inline-flex",
            height: 40,
            justifyContent: renderedCollapsed ? "center" : "flex-start",
            m: 0,
            p: 0,
            transition: `width ${SIDEBAR_MOTION_CURVE}, opacity ${SIDEBAR_FADE_EASING}`,
            width: renderedCollapsed ? 38 : 92,
          }}
        >
          <Box
            component="img"
            alt="ERG"
            src={renderedCollapsed ? ERG_ASSETS.mobileLogo : ERG_ASSETS.logo}
            sx={{
              height: 34,
              objectFit: "contain",
              objectPosition: renderedCollapsed ? "center" : "left center",
              transition: `width ${SIDEBAR_MOTION_CURVE}, opacity ${SIDEBAR_FADE_EASING}`,
              width: renderedCollapsed ? 32 : 86,
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowX: "hidden",
          overflowY: "auto",
          scrollbarColor: "#AAB3BE transparent",
          scrollbarWidth: "thin",
          boxSizing: "border-box",
          opacity: sidebarTransitioning ? 0.98 : 1,
          position: "relative",
          transform: navMotionTransform,
          transformOrigin: "left top",
          transition: `opacity ${SIDEBAR_FADE_EASING}, transform ${SUBMENU_MOTION_EASING}, padding ${SIDEBAR_MOTION_CURVE}`,
          width: "100%",
          willChange: "transform, opacity",
          zIndex: 1,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#AAB3BE",
            borderRadius: 8,
          },
        }}
      >
        <Box
          component="nav"
          sx={{
            display: "flex",
            flexDirection: "column",
            pb: 2,
            px: renderedCollapsed ? 0.45 : 1.15,
            transition: `padding ${SIDEBAR_MOTION_CURVE}`,
            width: "100%",
            "& > .centerup-nav-group + .centerup-nav-group": {
              mt: renderedCollapsed ? 1 : 0.5,
            },
          }}
        >
          {menuGroups.map((group, groupIndex) => (
            <Box
              key={groupIndex}
              className="centerup-nav-group"
              sx={{
                transition: `margin ${SIDEBAR_MOTION_CURVE}, opacity ${SIDEBAR_FADE_EASING}`,
                width: "100%",
              }}
            >
              {group.label ? (
                <Box
                  sx={{
                    height: renderedCollapsed ? 0 : 42,
                    opacity: renderedCollapsed ? 0 : 1,
                    overflow: "hidden",
                    transform: renderedCollapsed
                      ? "translateY(-6px)"
                      : "translateY(0)",
                    transition: `height ${SIDEBAR_MOTION_CURVE}, opacity ${SIDEBAR_FADE_EASING}, transform ${SUBMENU_MOTION_EASING}`,
                  }}
                >
                  <Typography
                    component="div"
                    sx={{
                      alignItems: "center",
                      color: NAV_MUTED_COLOR,
                      display: "inline-flex",
                      fontSize: 12,
                      fontWeight: 800,
                      height: 42,
                      letterSpacing: 0,
                      lineHeight: "18px",
                      p: "16px 8px 8px 12px",
                      textTransform: "uppercase",
                    }}
                  >
                    {group.label}
                  </Typography>
                </Box>
              ) : null}
              <List
                disablePadding
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: renderedCollapsed ? 0.75 : 0.5,
                  listStyle: "none",
                  m: 0,
                  overflow: "visible",
                  p: 0,
                  width: "100%",
                }}
              >
                {group.items.map((item, itemIndex) => (
                  <SidebarItem
                    key={item.id ?? item.path ?? `${groupIndex}-${itemIndex}`}
                    collapsed={renderedCollapsed}
                    currentPath={currentPath}
                    item={item}
                    onNavigate={onNavigate}
                    sidebarTransitioning={sidebarTransitioning}
                  />
                ))}
              </List>
            </Box>
          ))}
        </Box>

        {!hideSidebarBottom ? (
          <SidebarBottom
            collapsed={renderedCollapsed}
            portalInfo={portalInfo}
            onNavigate={onNavigate}
          />
        ) : null}
      </Box>
    </Drawer>
  );
}

interface SidebarItemProps {
  collapsed: boolean;
  item: MenuItem;
  currentPath: string;
  onNavigate: (path: string) => void;
  sidebarTransitioning: boolean;
}

function SidebarItem({
  collapsed,
  item,
  currentPath,
  onNavigate,
  sidebarTransitioning,
}: SidebarItemProps) {
  const [open, setOpen] = useState(false);
  const [collapsedFlyoutAnchor, setCollapsedFlyoutAnchor] =
    useState<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const hasChildren = Boolean(item.children?.length);
  const isActive = pathMatches(item.path, currentPath, true);

  const childActive = Boolean(
    item.children?.some((child) => {
      return (
        pathMatches(child.path, currentPath, false) ||
        child.children?.some((grandChild) => {
          return pathMatches(grandChild.path, currentPath, false);
        })
      );
    }),
  );

  const displayIcon = isReportMenu(item.label) ? (
    <CenterUpReportIcon />
  ) : (
    item.icon
  );

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!collapsed || sidebarTransitioning) {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      const resetTimer = window.setTimeout(
        () => setCollapsedFlyoutAnchor(null),
        0,
      );
      return () => window.clearTimeout(resetTimer);
    }
  }, [collapsed, sidebarTransitioning]);

  const collapsedFlyoutOpen =
    collapsed &&
    hasChildren &&
    Boolean(collapsedFlyoutAnchor) &&
    !sidebarTransitioning;

  function cancelCollapsedFlyoutClose() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openCollapsedFlyout(anchor: HTMLElement) {
    cancelCollapsedFlyoutClose();
    setCollapsedFlyoutAnchor(anchor);
  }

  function scheduleCollapsedFlyoutClose() {
    cancelCollapsedFlyoutClose();
    closeTimerRef.current = window.setTimeout(() => {
      setCollapsedFlyoutAnchor(null);
      closeTimerRef.current = null;
    }, 180);
  }

  function closeCollapsedFlyout() {
    cancelCollapsedFlyoutClose();
    setCollapsedFlyoutAnchor(null);
  }

  if (collapsed) {
    const miniSelected = hasChildren
      ? childActive || collapsedFlyoutOpen
      : isActive;

    return (
      <Box
        component="li"
        className="centerup-nav-node"
        sx={{
          display: "flex",
          justifyContent: "center",
          listStyle: "none",
          px: 0.5,
          width: "100%",
        }}
      >
        <ListItemButton
          disableRipple
          onMouseEnter={(event) => {
            if (hasChildren) {
              openCollapsedFlyout(event.currentTarget);
            }
          }}
          onMouseLeave={() => {
            if (hasChildren) {
              scheduleCollapsedFlyoutClose();
            }
          }}
          onClick={(event) => {
            if (hasChildren) {
              if (collapsedFlyoutOpen) {
                closeCollapsedFlyout();
                return;
              }
              openCollapsedFlyout(event.currentTarget);
              return;
            }
            if (item.path) {
              onNavigate(item.path);
            }
          }}
          onFocus={(event) => {
            if (hasChildren) {
              openCollapsedFlyout(event.currentTarget);
            }
          }}
          selected={miniSelected}
          sx={{
            alignItems: "center",
            background: miniSelected ? NAV_ACTIVE_BG : "transparent",
            border: miniSelected
              ? `1px solid ${NAV_ACTIVE_BORDER}`
              : "1px solid transparent",
            borderRadius: "12px",
            color: miniSelected ? NAV_PRIMARY : NAV_ITEM_COLOR,
            boxShadow: miniSelected ? NAV_ACTIVE_SHADOW : "none",
            display: "flex",
            flexDirection: "column",
            gap: 0.625,
            justifyContent: "center",
            minHeight: 58,
            px: 0.5,
            py: 1,
            position: "relative",
            textAlign: "center",
            transition:
              "background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
            width: "100%",
            "&.Mui-selected": {
              background: NAV_ACTIVE_BG,
              borderColor: NAV_ACTIVE_BORDER,
              boxShadow: NAV_ACTIVE_SHADOW,
              color: NAV_PRIMARY,
            },
            "&.Mui-selected:hover": { background: NAV_ACTIVE_BG },
            "&:hover": {
              background: miniSelected ? NAV_ACTIVE_BG : NAV_HOVER_BG,
              borderColor: miniSelected
                ? NAV_ACTIVE_BORDER
                : "rgba(145,158,171,0.18)",
              color: miniSelected ? NAV_PRIMARY : NAV_TEXT_COLOR,
            },
          }}
        >
          {hasChildren ? (
            <KeyboardArrowRightRoundedIcon
              sx={{
                color: "currentColor",
                fontSize: 15,
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
          ) : null}
          {displayIcon ? (
            <Box
              sx={{
                alignItems: "center",
                color: "currentColor",
                display: "flex",
                height: 22,
                justifyContent: "center",
                width: 22,
                "& .MuiSvgIcon-root": {
                  color: "currentColor",
                  fontSize: 22,
                },
              }}
            >
              {displayIcon}
            </Box>
          ) : null}
          <Typography
            sx={{
              color: "inherit",
              fontSize: 11,
              fontWeight: miniSelected ? 600 : 500,
              lineHeight: "14px",
              maxWidth: "100%",
              overflow: "hidden",
              px: 0.25,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {getCollapsedLabel(item.label)}
          </Typography>
        </ListItemButton>

        {hasChildren ? (
          <Popper
            anchorEl={collapsedFlyoutAnchor}
            modifiers={[
              {
                name: "offset",
                options: {
                  offset: [0, 20],
                },
              },
            ]}
            open={collapsedFlyoutOpen}
            placement="right"
            sx={{ zIndex: 1500 }}
          >
            <ClickAwayListener onClickAway={closeCollapsedFlyout}>
              <Paper
                elevation={0}
                onMouseEnter={cancelCollapsedFlyoutClose}
                onMouseLeave={scheduleCollapsedFlyoutClose}
                sx={{
                  backgroundColor: NAV_SURFACE_BG,
                  backgroundImage:
                    "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.76) 100%), linear-gradient(135deg, rgba(15,108,189,0.08) 0%, rgba(103,111,225,0.07) 48%, rgba(243,92,107,0.06) 100%)",
                  backdropFilter: "blur(8px) saturate(118%)",
                  WebkitBackdropFilter: "blur(8px) saturate(118%)",
                  border: `1px solid ${NAV_ACTIVE_BORDER}`,
                  borderRadius: "14px",
                  boxShadow:
                    "0 10px 24px rgba(103, 114, 182, 0.1), inset 0 1px 0 rgba(255,255,255,0.78)",
                  marginLeft: 1.5,
                  maxWidth: 192,
                  minWidth: 192,
                  overflow: "hidden",
                  py: 0.375,
                  transition: `opacity ${SIDEBAR_FADE_EASING}, transform ${SUBMENU_MOTION_EASING}`,
                }}
              >
                <List
                  disablePadding
                  sx={{ maxWidth: 192, minWidth: 192, p: 0 }}
                >
                  {item.children!.map((child, index) => {
                    const isChildActive = pathMatches(child.path, currentPath, false);

                    return (
                      <ListItemButton
                        disableRipple
                        key={
                          child.id ??
                          child.path ??
                          `${item.label}-collapsed-${index}`
                        }
                        onClick={() => {
                          if (child.path) {
                            onNavigate(child.path);
                          }
                          closeCollapsedFlyout();
                        }}
                        sx={{
                          alignItems: "center",
                          background: isChildActive
                            ? NAV_ACTIVE_BG
                            : "transparent",
                          color: isChildActive ? NAV_PRIMARY : NAV_ITEM_COLOR,
                          height: 36,
                          maxHeight: 36,
                          minHeight: 36,
                          px: 1.5,
                          py: 0,
                          "&:hover": {
                            background: isChildActive
                              ? NAV_ACTIVE_BG
                              : NAV_HOVER_BG,
                            color: isChildActive ? NAV_PRIMARY : NAV_TEXT_COLOR,
                          },
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            color: "inherit",
                            display: "block",
                            fontSize: 13.5,
                            fontWeight: isChildActive ? 600 : 500,
                            letterSpacing: 0,
                            lineHeight: "20px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {child.label}
                        </Typography>
                      </ListItemButton>
                    );
                  })}
                </List>
              </Paper>
            </ClickAwayListener>
          </Popper>
        ) : null}
      </Box>
    );
  }

  if (hasChildren) {
    const isPinnedOpen = item.id === "learning-activities";
    const isExpanded = open || childActive || isPinnedOpen;
    const isBranchActive = isActive;
    const isPreviewOpen = open && !childActive;
    const showExpandedChildren = isExpanded;

    return (
      <Box
        component="li"
        className="centerup-nav-node"
        sx={{
          display: "flex",
          flexDirection: "column",
          listStyle: "none",
          overflow: "visible",
          position: "relative",
          width: "100%",
        }}
      >
        <ListItemButton
          disableRipple
          onClick={() => setOpen((value) => !value)}
          sx={{
            alignItems: "center",
            background: isBranchActive
              ? NAV_ACTIVE_BG
              : isPreviewOpen
                ? NAV_PREVIEW_BG
                : "transparent",
            border: isBranchActive
              ? `1px solid ${NAV_ACTIVE_BORDER}`
              : isPreviewOpen
                ? `1px solid ${NAV_PREVIEW_BORDER}`
              : "1px solid transparent",
            borderRadius: "8px",
            color: isExpanded ? NAV_TEXT_COLOR : NAV_ITEM_COLOR,
            boxShadow: isBranchActive ? NAV_ACTIVE_SHADOW : "none",
            display: "flex",
            height: 44,
            minHeight: 44,
            overflow: "visible",
            p: "4px 8px 4px 8px",
            transition:
              "background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 220ms ease",
            width: "100%",
            "&:hover": {
              background: isBranchActive
                ? NAV_ACTIVE_BG
                : isPreviewOpen
                  ? NAV_PREVIEW_BG
                  : NAV_HOVER_BG,
              borderColor: isBranchActive
                ? NAV_ACTIVE_BORDER
                : isPreviewOpen
                  ? NAV_PREVIEW_BORDER
                : "rgba(145,158,171,0.18)",
              color: NAV_TEXT_COLOR,
            },
          }}
        >
          {displayIcon ? (
            <ListItemIcon
              sx={{
                alignItems: "center",
                color: "currentColor",
                display: "flex",
                flexShrink: 0,
                height: 20,
                justifyContent: "center",
              m: "0 10px 0 0",
                minWidth: 20,
                width: 20,
                "& .MuiSvgIcon-root": {
                  color: "currentColor",
                  fontSize: 20,
                },
              }}
            >
              {displayIcon}
            </ListItemIcon>
          ) : null}
          <ListItemText
            primary={item.label}
            slotProps={{
              primary: {
                sx: {
                  color: "inherit",
                  fontSize: 14,
                  fontWeight: isExpanded ? 700 : 600,
                  letterSpacing: 0,
                  lineHeight: "22px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                },
              },
            }}
            sx={{ m: 0, minWidth: 0 }}
          />
          <KeyboardArrowRightRoundedIcon
            sx={{
              color: "currentColor",
              flexShrink: 0,
              fontSize: 16,
              ml: "6px",
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </ListItemButton>

        <Collapse
          in={showExpandedChildren}
          timeout={{ enter: 240, exit: 200 }}
          easing={{
            enter: "cubic-bezier(0.24, 0.9, 0.32, 1)",
            exit: "cubic-bezier(0.32, 0.72, 0, 1)",
          }}
          sx={{
            overflow: "hidden",
            pl: 1.5,
            "& .MuiCollapse-wrapper": { overflow: "hidden" },
            "& .MuiCollapse-wrapperInner": { overflow: "hidden" },
          }}
        >
          <List
            disablePadding
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              listStyle: "none",
              m: 0,
              opacity: showExpandedChildren ? 1 : 0,
              overflow: "hidden",
              p: "4px 0 0 10px",
              position: "relative",
              transform: showExpandedChildren
                ? "translateY(0)"
                : "translateY(-4px)",
              transformOrigin: "top left",
              transition: `opacity ${SIDEBAR_FADE_EASING}, transform ${SUBMENU_MOTION_EASING}`,
              "&::before": {
                bgcolor: "#DCE3EB",
                borderRadius: "2px",
                bottom: 4,
                content: '""',
                left: 0,
                position: "absolute",
                top: 0,
                width: 2,
              },
            }}
          >
            {item.children!.map((child, index) => {
              const isChildActive = pathMatches(child.path, currentPath, false);
              const showChildArrow = Boolean(
                child.children?.length ||
                (isReportMenu(item.label) && isStudentLabel(child.label)),
              );

              return (
                <Box
                  key={child.id ?? child.path ?? `${item.label}-${index}`}
                  component="li"
                  sx={{
                    display: "flex",
                    listStyle: "none",
                    overflow: "visible",
                    position: "relative",
                    width: "100%",
                  }}
                >
                  <ListItemButton
                    disableRipple
                    onClick={() => {
                      if (!child.children?.length && child.path) {
                        onNavigate(child.path);
                      }
                    }}
                    sx={{
                      alignItems: "center",
                      background: isChildActive ? NAV_ACTIVE_BG : "transparent",
                      border: isChildActive
                        ? `1px solid ${NAV_ACTIVE_BORDER}`
                        : "1px solid transparent",
                      borderRadius: "8px",
                      color: isChildActive ? NAV_PRIMARY : NAV_ITEM_COLOR,
                      boxShadow: isChildActive ? NAV_ACTIVE_SHADOW : "none",
                      display: "flex",
                      height: 36,
                      minHeight: 36,
                      overflow: "visible",
                      p: "4px 8px 4px 10px",
                      position: "relative",
                      transition:
                        "background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 220ms ease",
                      width: "100%",
                      "&::before": {
                        WebkitMask: TREE_CONNECTOR_MASK,
                        bgcolor: "#DCE3EB",
                        content: '""',
                        height: 12,
                        left: 0,
                        mask: TREE_CONNECTOR_MASK,
                        position: "absolute",
                        top: 12,
                        transform: "translate(-12px, -4.8px)",
                        width: 12,
                        zIndex: 1,
                      },
                      "&:hover": {
                        background: isChildActive
                          ? NAV_ACTIVE_BG
                          : NAV_HOVER_BG,
                        borderColor: isChildActive
                          ? NAV_ACTIVE_BORDER
                          : "rgba(145,158,171,0.18)",
                        color: isChildActive ? NAV_PRIMARY : NAV_TEXT_COLOR,
                      },
                    }}
                  >
                    <ListItemText
                      primary={child.label}
                      slotProps={{
                        primary: {
                          sx: {
                            color: "inherit",
                            fontSize: 14,
                            fontWeight: isChildActive ? 700 : 600,
                            letterSpacing: 0,
                            lineHeight: "22px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          },
                        },
                      }}
                      sx={{ m: 0, minWidth: 0 }}
                    />
                    {showChildArrow ? (
                      <KeyboardArrowRightRoundedIcon
                        sx={{
                          color: "currentColor",
                          flexShrink: 0,
                          fontSize: 16,
                          ml: "6px",
                        }}
                      />
                    ) : null}
                  </ListItemButton>
                </Box>
              );
            })}
          </List>
        </Collapse>
      </Box>
    );
  }

  return (
    <Box
      component="li"
      className="centerup-nav-node"
      sx={{
        display: "flex",
        listStyle: "none",
        overflow: "visible",
        position: "relative",
        width: "100%",
      }}
    >
      <ListItemButton
        disableRipple
        onClick={() => item.path && onNavigate(item.path)}
        selected={isActive}
        sx={{
          alignItems: "center",
          background: isActive ? NAV_ACTIVE_BG : "transparent",
          border: isActive
            ? `1px solid ${NAV_ACTIVE_BORDER}`
            : "1px solid transparent",
          borderRadius: "8px",
          color: isActive ? NAV_PRIMARY : NAV_ITEM_COLOR,
          boxShadow: isActive ? NAV_ACTIVE_SHADOW : "none",
          display: "flex",
          height: 44,
          minHeight: 44,
          overflow: "visible",
          p: "4px 8px 4px 8px",
          transition:
            "background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 220ms ease",
          width: "100%",
          "&.Mui-selected": {
            background: NAV_ACTIVE_BG,
            borderColor: NAV_ACTIVE_BORDER,
            boxShadow: NAV_ACTIVE_SHADOW,
            color: NAV_PRIMARY,
          },
          "&.Mui-selected:hover": { background: NAV_ACTIVE_BG },
          "&:hover": {
            background: isActive ? NAV_ACTIVE_BG : NAV_HOVER_BG,
            borderColor: isActive
              ? NAV_ACTIVE_BORDER
              : "rgba(145,158,171,0.18)",
            color: isActive ? NAV_PRIMARY : NAV_TEXT_COLOR,
          },
        }}
      >
        {displayIcon ? (
          <ListItemIcon
            sx={{
              alignItems: "center",
              color: "currentColor",
              display: "flex",
              flexShrink: 0,
              height: 20,
              justifyContent: "center",
                m: "0 10px 0 0",
              minWidth: 20,
              width: 20,
              "& .MuiSvgIcon-root": {
                color: "currentColor",
                fontSize: 20,
              },
            }}
          >
            {displayIcon}
          </ListItemIcon>
        ) : null}
        <ListItemText
          primary={
            <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              <Box
                sx={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </Box>
              {item.badge ? (
                <Box
                  component="span"
                  sx={{
                    background: NAV_ACTIVE_BG,
                    border: `1px solid ${NAV_ACTIVE_BORDER}`,
                    borderRadius: "6px",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.62)",
                    color: NAV_PRIMARY,
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: "16px",
                    px: 0.75,
                  }}
                >
                  {item.badge}
                </Box>
              ) : null}
            </Box>
          }
          slotProps={{
            primary: {
              sx: {
                color: "inherit",
                fontSize: 14,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: 0,
                lineHeight: "22px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            },
          }}
          sx={{ m: 0, minWidth: 0 }}
        />
      </ListItemButton>
    </Box>
  );
}

function CenterUpReportIcon() {
  return (
    <SvgIcon viewBox="0 0 24 24" sx={{ fontSize: 20 }}>
      <path
        d="M12 2.75c5.109 0 9.25 4.141 9.25 9.25S17.109 21.25 12 21.25 2.75 17.109 2.75 12 6.891 2.75 12 2.75Z"
        fill="#AAB4BF"
      />
      <path
        d="M8.1 15.35c-.64 0-1.1-.46-1.1-1.1v-2.45c0-.64.46-1.1 1.1-1.1s1.1.46 1.1 1.1v2.45c0 .64-.46 1.1-1.1 1.1Zm3.65 1.15c-.64 0-1.1-.46-1.1-1.1V8.6c0-.64.46-1.1 1.1-1.1s1.1.46 1.1 1.1v6.8c0 .64-.46 1.1-1.1 1.1Z"
        fill="#1C252E"
      />
    </SvgIcon>
  );
}

function SidebarBottom({
  collapsed,
  portalInfo,
  onNavigate,
}: {
  collapsed: boolean;
  portalInfo?: PortalInfo;
  onNavigate: (path: string) => void;
}) {
  const centerName =
    portalInfo?.centerName || portalInfo?.name || "ERG Education";
  const planLabel = portalInfo?.plan || "ADVANCED";

  return (
    <Box
      sx={{
        maxHeight: collapsed ? 12 : 240,
        opacity: collapsed ? 0 : 1,
        overflow: "hidden",
        pointerEvents: collapsed ? "none" : "auto",
        px: 1.5,
        pb: collapsed ? 0 : 3,
        pt: collapsed ? 0 : 4,
        transform: collapsed
          ? "translateY(10px)"
          : "translateY(0)",
        transformOrigin: "bottom center",
        transition: `max-height ${SIDEBAR_MOTION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${SIDEBAR_FADE_EASING}, transform ${SUBMENU_MOTION_EASING}, padding ${SIDEBAR_MOTION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      <Divider
        sx={{ borderColor: "rgba(145,158,171,0.12)", mb: 2, width: "100%" }}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 1.5,
          position: "relative",
        }}
      >
        <Box sx={{ height: 44, position: "relative", width: 112 }}>
          <Box
            component="img"
            alt="ERG Education"
            src={ERG_ASSETS.logo}
            sx={{
              height: 36,
              objectFit: "contain",
              objectPosition: "center",
              width: 112,
            }}
          />
          <Box
            component="span"
            sx={{
              background: NAV_ACTIVE_BG,
              border: `1px solid ${NAV_ACTIVE_BORDER}`,
              borderRadius: "6px",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.62)",
              color: NAV_PRIMARY,
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "18px",
              px: 0.75,
              position: "absolute",
              right: -6,
              top: -8,
            }}
          >
            {planLabel}
          </Box>
        </Box>
      </Box>

      <Typography
        sx={{
          color: NAV_ITEM_COLOR,
          fontSize: 13,
          fontWeight: 400,
          lineHeight: "22px",
          mb: 3,
          textAlign: "center",
        }}
      >
        {centerName}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
        {["Mua Coin", "Nang cap"].map((label) => (
          <Box
            key={label}
            onClick={() => {}}
            sx={{
              "&:hover": {
                background: NAV_ACTIVE_BG,
                borderColor: NAV_ACTIVE_BORDER,
                color: NAV_PRIMARY,
              },
              background: NAV_BUTTON_BG,
              border: `1px solid ${NAV_ACTIVE_BORDER}`,
              borderRadius: "6px",
              color: NAV_PRIMARY,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.72)",
              px: 2,
              py: 1,
            }}
          >
            {label}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Box
          onClick={() => onNavigate("/faqs")}
          sx={{
            "&:hover": { color: NAV_PRIMARY },
            alignItems: "center",
            color: NAV_ITEM_COLOR,
            cursor: "pointer",
            display: "flex",
            fontSize: 12,
            gap: 0.5,
          }}
        >
          <HelpOutlineRoundedIcon sx={{ fontSize: 16 }} />
          Trung tam tro giup
        </Box>
      </Box>
    </Box>
  );
}
