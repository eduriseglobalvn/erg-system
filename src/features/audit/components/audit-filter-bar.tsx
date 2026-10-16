import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import type { AuditFilters, AuditOutcome } from "@/features/audit/types/audit-types";

const outcomeOptions: Array<{ label: string; value: AuditOutcome | "" }> = [
  { label: "Tất cả kết quả", value: "" },
  { label: "Thành công", value: "SUCCESS" },
  { label: "Thất bại", value: "FAILURE" },
  { label: "Từ chối", value: "DENIED" },
  { label: "Một phần", value: "PARTIAL" },
];

export function AuditFilterBar({ filters, onChange, onReset }: {
  filters: AuditFilters;
  onChange: (next: AuditFilters) => void;
  onReset: () => void;
}) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.25, p: 2 }}>
      <TextField
        label="Mã người thực hiện"
        size="small"
        value={filters.actorId ?? ""}
        onChange={(event) => onChange({ ...filters, actorId: event.target.value || undefined, page: 0 })}
        sx={{ minWidth: { xs: "100%", sm: 190 } }}
      />
      <TextField
        label="Loại tài nguyên"
        size="small"
        value={filters.resourceType ?? ""}
        onChange={(event) => onChange({ ...filters, resourceType: event.target.value || undefined, page: 0 })}
        sx={{ minWidth: { xs: "100%", sm: 170 } }}
      />
      <TextField
        label="Kết quả"
        select
        size="small"
        value={filters.outcome ?? ""}
        onChange={(event) => onChange({ ...filters, outcome: (event.target.value || undefined) as AuditOutcome | undefined, page: 0 })}
        sx={{ minWidth: { xs: "100%", sm: 165 } }}
      >
        {outcomeOptions.map((option) => <MenuItem key={option.value || "all"} value={option.value}>{option.label}</MenuItem>)}
      </TextField>
      <TextField
        label="Từ ngày"
        type="date"
        size="small"
        value={filters.from?.slice(0, 10) ?? ""}
        onChange={(event) => onChange({ ...filters, from: event.target.value ? `${event.target.value}T00:00:00Z` : undefined, page: 0 })}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        label="Đến ngày"
        type="date"
        size="small"
        value={filters.to?.slice(0, 10) ?? ""}
        onChange={(event) => onChange({ ...filters, to: event.target.value ? `${event.target.value}T23:59:59.999Z` : undefined, page: 0 })}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Button startIcon={<FilterAltRoundedIcon />} onClick={onReset} sx={{ minHeight: 40, ml: { sm: "auto" } }}>
        Đặt lại
      </Button>
    </Box>
  );
}
