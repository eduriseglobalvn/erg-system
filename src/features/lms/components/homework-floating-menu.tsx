import { useMemo, useState } from "react";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SchoolIcon from "@mui/icons-material/School";
import SendIcon from "@mui/icons-material/Send";
import GroupsIcon from "@mui/icons-material/Groups";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface HomeworkFloatingMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onAction: (action: string) => void;
}

export function HomeworkFloatingMenu({ open, setOpen, onAction }: HomeworkFloatingMenuProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [menuHovered, setMenuHovered] = useState(false);
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const items = [
    { id: "giao-bai-tap", icon: SendIcon, label: ["Giao bài tập"], action: "assign" },
    { id: "quan-ly-lop-hoc", icon: SchoolIcon, label: ["Quản lý", "lớp học"], action: "classes" },
    { id: "nhom-hoc-sinh", icon: GroupsIcon, label: ["Quản lý nhóm", "học sinh"], action: "groups" },
    { id: "kho-bai-tap", icon: FolderOpenIcon, label: ["Kho bài tập"], action: "exerciseBank" },
  ];
  const TOTAL_H = 580;
  const PANEL_W = 88;
  const BUMP_EXT = 36;
  const SVG_W = PANEL_W + BUMP_EXT;
  const VALLEY_X = BUMP_EXT;
  const PEAK_X = 2;
  const centerY = TOTAL_H / 2;
  const BUMP_H = 132;
  const CLOSED_OFFSET = SVG_W - 26;
  const HOVER_PEEK = 24;
  const shapePath = useMemo(() => {
    const r = 34;
    const d: string[] = [];
    const bumpStart = centerY + BUMP_H / 2;
    const bumpEnd = centerY - BUMP_H / 2;
    d.push(`M${SVG_W},0`, `L${SVG_W},${TOTAL_H}`, `L${VALLEY_X + r},${TOTAL_H}`, `Q${VALLEY_X},${TOTAL_H} ${VALLEY_X},${TOTAL_H - r}`, `L${VALLEY_X},${bumpStart}`);
    d.push(`C${VALLEY_X},${bumpStart - BUMP_H * 0.34} ${PEAK_X},${centerY + BUMP_H * 0.3} ${PEAK_X},${centerY}`, `C${PEAK_X},${centerY - BUMP_H * 0.3} ${VALLEY_X},${bumpEnd + BUMP_H * 0.34} ${VALLEY_X},${bumpEnd}`, `L${VALLEY_X},${r}`, `Q${VALLEY_X},0 ${VALLEY_X + r},0`, "Z");
    return d.join(" ");
  }, [BUMP_H, SVG_W, VALLEY_X, PEAK_X, centerY, TOTAL_H]);
  const activeIndex = currentPath.startsWith("/homework/assign") || currentPath === "/homework" ? 0 : currentPath.startsWith("/classes") ? 1 : currentPath.startsWith("/homework/student-groups") ? 2 : currentPath.startsWith("/homework/exercise-bank") ? 3 : -1;

  return (
    <Box component="aside" aria-label="Menu nhanh bài tập" sx={{ position: "fixed", right: 0, top: "50%", zIndex: 50, display: { xs: "none", xl: "block" }, transform: "translateY(-50%)" }}>
      <Box
        sx={{ position: "relative", width: SVG_W, height: TOTAL_H, transform: open ? "translateX(0)" : `translateX(${CLOSED_OFFSET - (menuHovered ? HOVER_PEEK : 0)}px)`, transition: "transform 700ms cubic-bezier(0.16,1,0.3,1)", willChange: "transform" }}
        onMouseEnter={() => setMenuHovered(true)}
        onMouseLeave={() => setMenuHovered(false)}
      >
        <svg aria-hidden="true" width={SVG_W} height={TOTAL_H} viewBox={`0 0 ${SVG_W} ${TOTAL_H}`} fill="none" style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 1px 2px rgba(15,23,42,.08))" }}>
          <path d={shapePath} fill="white" stroke="#e2e8f0" strokeWidth="1" />
        </svg>
        <Box component="button" type="button" onClick={() => setOpen(!open)} aria-label={open ? "Đóng menu nhanh bài tập" : "Mở menu nhanh bài tập"} aria-expanded={open} sx={{ position: "absolute", zIndex: 40, left: 0, top: centerY, width: BUMP_EXT + 8, height: BUMP_H, transform: "translateY(-50%)", border: 0, bgcolor: "transparent", cursor: "pointer", p: 0 }}>
          <Box sx={{ position: "absolute", top: "50%", left: 10, display: "flex", alignItems: "center", gap: "3px", transform: "translateY(-50%)" }}>
            <Box sx={{ width: 3, height: 12, borderRadius: 999, bgcolor: "#1db9ff", opacity: 0.75 }} />
            <Box sx={{ width: 4, height: 24, borderRadius: 999, bgcolor: "primary.main", boxShadow: 1 }} />
          </Box>
        </Box>
        <Box sx={{ position: "absolute", insetBlock: 0, right: 0, zIndex: 30, left: VALLEY_X, width: PANEL_W, display: "flex", flexDirection: "column", justifyContent: "space-around", py: 4 }}>
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeIndex === index;
            const isHovered = hoveredIndex === index;
            return (
              <Box component="button" key={item.id} type="button" onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} onClick={() => onAction(item.action)} sx={{ position: "relative", display: "flex", width: "100%", minHeight: 82, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.75, border: 0, bgcolor: "transparent", cursor: "pointer", transform: isHovered ? "translateY(-1px)" : "none", transition: "all 300ms ease", p: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, border: 1, borderColor: isActive ? "#b8d6fa" : "#d9e0ea", borderRadius: "50%", bgcolor: isActive ? "primary.light" : "common.white", color: isActive ? "primary.main" : "#94a3b8", boxShadow: 1, "&:hover": { borderColor: "#b8d6fa", color: "primary.main" } }}>
                  <Icon sx={{ fontSize: 20, strokeWidth: 2.35 }} />
                </Box>
                <Typography sx={{ display: "flex", width: "100%", flexDirection: "column", px: 0.5, textAlign: "center", color: isActive ? "primary.main" : "text.secondary", fontSize: 12, fontWeight: 600, lineHeight: 1.18 }}>
                  {item.label.map((line) => <span key={line}>{line}</span>)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
