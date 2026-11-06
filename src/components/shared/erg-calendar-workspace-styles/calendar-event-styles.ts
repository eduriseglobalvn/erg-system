import type { ErgCalendarTone } from "../erg-calendar-types";
import { toneMap } from "./calendar-shell-styles";

export function eventChipSx(compact: boolean, tone: { background: string; border: string; text: string }) {
  return {
    backgroundColor: compact ? softenColor(tone.border, 0.14) : softenColor(tone.background, 0.52),
    border: compact ? "0" : `1px solid ${softenColor(tone.border, 0.2)}`,
    borderLeft: compact ? "0" : `4px solid ${softenColor(tone.border, 0.62)}`,
    borderRadius: compact ? "6px" : "10px",
    color: compact ? "#202124" : tone.text,
    cursor: "pointer",
    minHeight: compact ? 22 : 76,
    outline: "none",
    px: compact ? 0.7 : 1.15,
    py: compact ? 0.2 : 1,
    transition: "background-color 140ms ease, box-shadow 140ms ease, filter 140ms ease",
    "&:focus-visible": {
      boxShadow: `0 0 0 3px ${softenColor(tone.border, 0.14)}, 0 0 0 1px ${softenColor(tone.border, 0.4)}`,
    },
    "&:hover": {
      backgroundColor: compact ? softenColor(tone.border, 0.2) : softenColor(tone.background, 0.66),
      boxShadow: compact ? "none" : "0 2px 6px rgba(60,64,67,0.16)",
      filter: "saturate(1.02)",
    },
  };
}

export function softenColor(color: string, alpha: number) {
  const normalized = color.trim();
  const hexMatch = normalized.match(/^#([0-9a-f]{6})$/i);
  if (!hexMatch) return normalized;

  const value = hexMatch[1];
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export const eventDetailPaperSx = {
  border: "1px solid rgba(217,226,239,0.92)",
  borderRadius: "18px",
  boxShadow: "0 22px 70px rgba(15,23,42,0.18)",
  overflow: "hidden",
};

export function eventDetailHeaderSx(tone: ErgCalendarTone) {
  const color = toneMap[tone].border;
  return {
    alignItems: "flex-start",
    background: `linear-gradient(135deg, ${color} 0%, #6C63FF 100%)`,
    display: "flex",
    gap: 2,
    justifyContent: "space-between",
    px: 2,
    py: 1.65,
  };
}

export function miniPickerDaySx(isSelected: boolean, isToday: boolean, outsideCurrentMonth: boolean) {
  return {
    backgroundColor: isSelected ? "#D2E3FC" : isToday ? "#E8F0FE" : "transparent",
    border: "1px solid transparent",
    borderRadius: "50%",
    boxShadow: "none",
    color: isSelected ? "#1967D2" : isToday ? "#1967D2" : outsideCurrentMonth ? "#9AA0A6" : "#202124",
    fontSize: 11.25,
    fontWeight: isSelected || isToday ? 700 : 500,
    height: 27,
    lineHeight: "27px",
    transition: "background-color 120ms ease, color 120ms ease, box-shadow 120ms ease",
    width: 27,
    "&:hover": { backgroundColor: isSelected ? "#D2E3FC" : "#EEF2F7" },
  };
}

export function miniEventDotSx(isSelected: boolean, isToday: boolean) {
  return {
    backgroundColor: isSelected ? "#0071E3" : isToday ? "#0071E3" : "#A7B0FF",
    borderRadius: "50%",
    bottom: 3,
    boxShadow: isSelected ? "0 0 0 2px #EEF4FF" : "none",
    height: 4,
    left: "50%",
    position: "absolute",
    transform: "translateX(-50%)",
    width: 4,
  };
}

export function calendarDayCellSx(isCurrentMonth: boolean, isSelected: boolean) {
  return {
    backgroundColor: isCurrentMonth ? "#FFFFFF" : "#F8FAFD",
    borderBottom: "1px solid #DDE3EA",
    borderRight: "1px solid #DDE3EA",
    boxShadow: isSelected ? "inset 0 0 0 1.5px #1A73E8" : "none",
    cursor: "pointer",
    minHeight: 0,
    p: 0.65,
    position: "relative",
    transition: "background-color 140ms ease, box-shadow 140ms ease",
    zIndex: isSelected ? 1 : "auto",
    "&:hover": { backgroundColor: isCurrentMonth ? "#FAFBFD" : "#F3F6FA" },
  };
}

export function calendarDayNumberSx(isToday: boolean, isSelected: boolean, isCurrentMonth: boolean) {
  return {
    alignItems: "center",
    backgroundColor: isToday ? "#1A73E8" : "transparent",
    borderRadius: "999px",
    color: isToday ? "#FFFFFF" : isCurrentMonth ? "#202124" : "#9AA0A6",
    display: "inline-flex",
    fontSize: 12.5,
    fontWeight: isToday || isSelected ? 700 : 500,
    height: 24,
    justifyContent: "center",
    width: 24,
  };
}
