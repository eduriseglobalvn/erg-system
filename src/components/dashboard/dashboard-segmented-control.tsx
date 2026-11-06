import Box from "@mui/material/Box";
import { cn } from "@/lib/utils";

type DashboardSegmentOption = {
  value: string;
  label: string;
};

export function DashboardSegmentedControl({
  onChange,
  options,
  value,
}: {
  options: DashboardSegmentOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Box className="inline-flex items-center gap-1 rounded-xl border p-1 shadow-none" sx={{ bgcolor: "background.default", borderColor: "divider" }}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative min-h-7 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-all",
              active
                ? "bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </Box>
  );
}
