import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputBase from "@mui/material/InputBase";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { ink, stripes, tone, type } from "./overview-styles";

export type QuickChip = { count: number; key: string; label: string; tone: "clash" | "neutral" | "warn" };
export type LegendItem = { label: string; sx: object };

const chipTone = {
  clash: { bg: tone.clash.bg, color: tone.clash.text, weight: 600 },
  neutral: { bg: tone.neutral.bg, color: tone.neutral.text, weight: 400 },
  warn: { bg: tone.warn.bg, color: tone.warn.text, weight: 400 },
} as const;

const swatch = { borderRadius: "3px", display: "inline-block", height: 10, verticalAlign: "middle", width: 12 } as const;

/** Chu thich 6 muc cua tab giao vien (board AdminOverviewTeacher): o 12×10, bo 3, khe 14. */
export function teacherLegend(minTravelMinutes: number): LegendItem[] {
  return [
    { label: "Đã áp dụng", sx: { backgroundColor: ink.primarySofter } },
    { label: "Nháp", sx: { backgroundImage: stripes(3, tone.surface, tone.draft.stripe), boxShadow: `inset 0 0 0 1px ${ink.primary}` } },
    { label: "Trùng", sx: { backgroundColor: tone.clash.bg, boxShadow: `inset 0 0 0 1.5px ${tone.clash.edge}` } },
    { label: `Không kịp di chuyển (< ${minTravelMinutes}′)`, sx: { backgroundColor: tone.clash.bg, outline: `1.5px dashed ${tone.clash.edge}`, outlineOffset: -1.5 } },
    { label: "Trợ giảng (TG)", sx: { backgroundColor: tone.surface, outline: `1px dashed ${ink.primary}`, outlineOffset: -1 } },
    { label: "Nghỉ", sx: { backgroundImage: stripes(3, tone.off.stripe, tone.off.stripeAlt) } },
  ];
}

type Props = {
  chips: readonly QuickChip[];
  legend: readonly LegendItem[];
  onQuick: (key: string) => void;
  onSearch: (value: string) => void;
  placeholder: string;
  quick: string;
  search: string;
};

/** Thanh loc tab «Theo giáo viên» (board): o tim 240×32, chip nhanh 28px (dang bat co vien primary), chu thich ben phai. */
export function OverviewFilterBar({ chips, legend, onQuick, onSearch, placeholder, quick, search }: Props) {
  const [text, setText] = useState(search);
  const debounced = useDebouncedValue(text, 300);
  useEffect(() => { if (debounced !== search) onSearch(debounced); }, [debounced, onSearch, search]);
  return (
    <Box className="erg-print-hide" sx={{ ...type(13), alignItems: "center", color: ink.textSecondary, display: "flex", flexWrap: "wrap", gap: 1 }}>
      <InputBase
        inputProps={{ "aria-label": placeholder }} onChange={(event) => setText(event.target.value)} placeholder={placeholder} value={text}
        sx={{ ...type(13), bgcolor: ink.surface, border: `1px solid ${ink.border}`, borderRadius: `${ergEnterpriseTokens.radius.control}px`, height: 32, px: "10px", width: 240 }}
      />
      {chips.map((chip) => {
        const style = chipTone[chip.tone];
        const on = quick === chip.key;
        return (
          <ButtonBase
            aria-pressed={on} key={chip.key} onClick={() => onQuick(on ? "" : chip.key)}
            sx={{ ...type(12, style.weight), alignItems: "center", bgcolor: style.bg, border: `1px solid ${on ? ink.primary : "transparent"}`, borderRadius: `${ergEnterpriseTokens.radius.chip}px`, color: style.color, display: "inline-flex", height: 28, px: "10px" }}
          >
            {chip.label} · {chip.count}
          </ButtonBase>
        );
      })}
      <Box aria-label="Chú thích" component="ul" sx={{ ...type(12), color: ink.textMuted, display: "inline-flex", flexWrap: "wrap", gap: "14px", listStyle: "none", m: 0, ml: "auto", p: 0 }}>
        {legend.map((item) => <li key={item.label}><Box component="span" sx={{ ...swatch, ...item.sx }} /> {item.label}</li>)}
      </Box>
    </Box>
  );
}
