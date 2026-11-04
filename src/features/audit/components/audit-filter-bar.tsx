import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/vi";
import { useState } from "react";
import type { AuditFilters, AuditOutcome } from "@/features/audit/types/audit-types";

const outcomeOptions: Array<{ label: string; value: AuditOutcome | "" }> = [
  { label: "Tất cả kết quả", value: "" },
  { label: "Thành công", value: "SUCCESS" },
  { label: "Thất bại", value: "FAILURE" },
  { label: "Từ chối", value: "DENIED" },
  { label: "Một phần", value: "PARTIAL" },
];

// Filters hold UTC instants of local day boundaries; the picker shows the user's local calendar date.
const toPicker = (iso?: string) => (iso ? dayjs(iso) : null);
const fromDayStart = (value: Dayjs | null) => (value?.isValid() ? value.startOf("day").toISOString() : undefined);
const toDayEnd = (value: Dayjs | null) => (value?.isValid() ? value.endOf("day").toISOString() : undefined);

export function AuditFilterBar({ filters, onApply, onReset }: {
  filters: AuditFilters;
  onApply: (next: AuditFilters) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<AuditFilters>(filters);
  const set = (patch: Partial<AuditFilters>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <LocalizationProvider adapterLocale="vi" dateAdapter={AdapterDayjs}>
      <Box
        component="form"
        onSubmit={(event) => { event.preventDefault(); onApply({ ...draft, page: 0 }); }}
        sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.25, p: 2 }}
      >
        <TextField
          label="Mã người thực hiện"
          size="small"
          value={draft.actorId ?? ""}
          onChange={(event) => set({ actorId: event.target.value || undefined })}
          sx={{ minWidth: { xs: "100%", sm: 190 } }}
        />
        <TextField
          label="Loại tài nguyên"
          size="small"
          value={draft.resourceType ?? ""}
          onChange={(event) => set({ resourceType: event.target.value || undefined })}
          sx={{ minWidth: { xs: "100%", sm: 170 } }}
        />
        <TextField
          label="Kết quả"
          select
          size="small"
          value={draft.outcome ?? ""}
          onChange={(event) => set({ outcome: (event.target.value || undefined) as AuditOutcome | undefined })}
          sx={{ minWidth: { xs: "100%", sm: 165 } }}
        >
          {outcomeOptions.map((option) => <MenuItem key={option.value || "all"} value={option.value}>{option.label}</MenuItem>)}
        </TextField>
        <DatePicker
          format="DD/MM/YYYY"
          label="Từ ngày"
          maxDate={toPicker(draft.to) ?? undefined}
          onChange={(value) => set({ from: fromDayStart(value) })}
          slotProps={{ field: { clearable: true }, textField: { size: "small" } }}
          value={toPicker(draft.from)}
        />
        <DatePicker
          format="DD/MM/YYYY"
          label="Đến ngày"
          minDate={toPicker(draft.from) ?? undefined}
          onChange={(value) => set({ to: toDayEnd(value) })}
          slotProps={{ field: { clearable: true }, textField: { size: "small" } }}
          value={toPicker(draft.to)}
        />
        <Box sx={{ display: "flex", gap: 1, ml: { sm: "auto" } }}>
          <Button type="button" variant="text" onClick={() => { setDraft({ page: 0, size: filters.size }); onReset(); }}>Đặt lại</Button>
          <Button type="submit" variant="contained">Áp dụng</Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
