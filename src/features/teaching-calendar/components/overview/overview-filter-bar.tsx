import { useEffect, useState } from "react";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { ScheduleLegend, type ScheduleLegendItem } from "../shared/schedule-legend";

export type QuickChip = { count: number; key: string; label: string; tone: "clash" | "neutral" | "warn" };

type Props = {
  chips: readonly QuickChip[];
  legend: readonly ScheduleLegendItem[];
  legendLabels?: Partial<Record<ScheduleLegendItem, string>>;
  onQuick: (key: string) => void;
  onSearch: (value: string) => void;
  placeholder: string;
  quick: string;
  search: string;
};

/** Thanh loc chung cua 2 tab bang tong (6.6, 6.7): o tim 240px, chip nhanh (dang bat co vien primary), chu thich ben phai. */
export function OverviewFilterBar({ chips, legend, legendLabels, onQuick, onSearch, placeholder, quick, search }: Props) {
  const [text, setText] = useState(search);
  const debounced = useDebouncedValue(text, 300);
  useEffect(() => { if (debounced !== search) onSearch(debounced); }, [debounced, onSearch, search]);
  return (
    <Stack className="erg-print-hide" direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
      <ErgSearchField onChange={(event) => setText(event.target.value)} placeholder={placeholder} sx={{ width: 240 }} value={text} />
      {chips.map((chip) => {
        const tone = scheduleTokens[chip.tone];
        const on = quick === chip.key;
        return (
          <Chip
            aria-pressed={on} clickable key={chip.key} label={`${chip.label} · ${chip.count}`} onClick={() => onQuick(on ? "" : chip.key)}
            sx={{ bgcolor: tone.bg, border: 1, borderColor: on ? "primary.main" : "transparent", color: tone.text }}
          />
        );
      })}
      <Stack sx={{ ml: "auto" }}><ScheduleLegend items={[...legend]} labels={legendLabels} /></Stack>
    </Stack>
  );
}
