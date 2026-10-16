import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { getEmptyScopeOptionLabel, getScopeOptionValue } from "./erg-calendar-formatters";
import type { ErgCalendarLaneSummary } from "./erg-calendar-types";
import { mobileScopeDrawerPaperSx, mobileScopeOptionSx } from "./erg-calendar-workspace-styles";

export function CalendarScopePicker({ label, onClose, onSelect, open, options, selectedValue }: {
  label: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  open: boolean;
  options: ErgCalendarLaneSummary[];
  selectedValue: string;
}) {
  const noun = label.replace(/^Chọn\s+/i, "").toLocaleLowerCase("vi");
  return (
    <Drawer anchor="bottom" onClose={onClose} open={open} slotProps={{ paper: { "aria-labelledby": "calendar-scope-picker-title", role: "dialog", sx: mobileScopeDrawerPaperSx } }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", px: 2, py: 1.25 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography id="calendar-scope-picker-title" sx={{ color: "#172033", fontSize: 17, fontWeight: 900 }}>{label}</Typography>
          <Typography sx={{ color: "#667085", fontSize: 12.5, mt: 0.2 }}>Lựa chọn sẽ áp dụng ngay cho lịch đang xem.</Typography>
        </Box>
        <IconButton aria-label="Đóng bộ lọc lịch" onClick={onClose} sx={{ minHeight: 44, minWidth: 44 }}><CloseRoundedIcon /></IconButton>
      </Box>
      <List aria-label={label} role="listbox" sx={{ overflowY: "auto", px: 1, pb: "max(16px, env(safe-area-inset-bottom))", pt: 0 }}>
        <ScopeOption color="#0F6CBD" label={`Tất cả ${noun}`} onClick={() => onSelect("")} selected={!selectedValue} />
        {options.map((option) => (
          <ScopeOption color={option.color} count={option.count} key={getScopeOptionValue(option)} label={option.label} onClick={() => onSelect(getScopeOptionValue(option))} selected={selectedValue === getScopeOptionValue(option)} />
        ))}
        {!options.length ? <Typography sx={{ color: "#667085", fontSize: 13.5, px: 1.5, py: 2 }}>{getEmptyScopeOptionLabel(label)}</Typography> : null}
      </List>
    </Drawer>
  );
}

function ScopeOption({ color, count, label, onClick, selected }: { color: string; count?: number; label: string; onClick: () => void; selected: boolean }) {
  return (
    <ListItemButton aria-selected={selected} onClick={onClick} role="option" selected={selected} sx={mobileScopeOptionSx}>
      <ListItemIcon sx={{ minWidth: 34 }}>
        <Box sx={{ alignItems: "center", backgroundColor: selected ? color : "transparent", border: `2px solid ${color}`, borderRadius: "50%", color: "#FFFFFF", display: "inline-flex", height: 20, justifyContent: "center", width: 20 }}>
          {selected ? <CheckRoundedIcon sx={{ fontSize: 15 }} /> : null}
        </Box>
      </ListItemIcon>
      <ListItemText primary={label} secondary={typeof count === "number" ? `${count} lịch` : undefined} slotProps={{ primary: { sx: { color: "#172033", fontSize: 14, fontWeight: selected ? 850 : 700 } }, secondary: { sx: { color: "#667085", fontSize: 12 } } }} />
    </ListItemButton>
  );
}
