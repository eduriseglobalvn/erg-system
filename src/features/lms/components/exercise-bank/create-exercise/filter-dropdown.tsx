import TextField from "@mui/material/TextField";
import { cn } from "@/lib/utils";

interface FilterDropdownProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  children: React.ReactNode;
  className?: string;
  isFiltered?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export function FilterDropdown({
  value,
  onChange,
  children,
  className,
  isFiltered,
  icon: Icon,
}: FilterDropdownProps) {
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <TextField
        select
        fullWidth
        size="small"
        value={value}
        onChange={onChange}
        sx={{ "& .MuiSelect-select": { fontSize: 12, fontWeight: isFiltered ? 600 : 500, py: 0.75, pl: Icon ? 4 : 1.25 } }}
      >
        {children}
      </TextField>
      {Icon && (
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#0F6CBD] shrink-0" />
      )}
    </div>
  );
}
