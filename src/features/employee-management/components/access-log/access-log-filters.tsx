import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import type { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import { useState } from "react";
import { useEmployees } from "@/features/employee-management/hooks/use-employee-management";
import { ACCESS_RESULT_LABEL, type AccessResult } from "@/features/employee-management/lib/access-log-display";
import type { EmployeeItem, SecurityFeedFilters } from "@/features/employee-management/types/employee-management";

export type AccessLogFilterState = {
  from: Dayjs | null;
  person: EmployeeItem | null;
  result: AccessResult | "";
  sourceType: SecurityFeedFilters["sourceType"] | "";
  to: Dayjs | null;
};

const SOURCE_OPTIONS: Array<{ label: string; value: AccessLogFilterState["sourceType"] }> = [
  { label: "Tất cả nguồn", value: "" },
  { label: "Đăng nhập", value: "LOGIN_ATTEMPT" },
  { label: "Cảnh báo bảo mật", value: "SECURITY_EVENT" },
  { label: "Phiên đăng nhập", value: "SESSION" },
  { label: "Hoạt động quản trị", value: "USER_ACTIVITY" },
];

const RESULT_OPTIONS = (["failed", "warning", "success"] as const).map((value) => ({ label: ACCESS_RESULT_LABEL[value], value }));

export function AccessLogFilters({
  onChange,
  state,
  tenantId,
}: {
  onChange: (next: AccessLogFilterState) => void;
  state: AccessLogFilterState;
  tenantId: string;
}) {
  const [personSearch, setPersonSearch] = useState("");
  const people = useEmployees(tenantId, { limit: 20, page: 1, search: personSearch.trim() || undefined });
  const set = (patch: Partial<AccessLogFilterState>) => onChange({ ...state, ...patch });

  return (
    <LocalizationProvider adapterLocale="vi" dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { md: "repeat(5, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))", xs: "1fr" }, p: { md: 2.5, xs: 2 } }}>
        <Autocomplete
          filterOptions={(options) => options}
          getOptionLabel={(option) => option.fullName || option.email}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText="Không tìm thấy nhân sự"
          onChange={(_, person) => set({ person })}
          onInputChange={(_, value, reason) => { if (reason === "input") setPersonSearch(value); }}
          options={people.data?.users ?? []}
          renderInput={(params) => <TextField {...params} label="Nhân sự" size="small" />}
          size="small"
          value={state.person}
        />
        <DatePicker
          format="DD/MM/YYYY"
          label="Từ ngày"
          maxDate={state.to ?? undefined}
          onChange={(from) => set({ from })}
          slotProps={{ field: { clearable: true }, textField: { size: "small" } }}
          value={state.from}
        />
        <DatePicker
          format="DD/MM/YYYY"
          label="Đến ngày"
          minDate={state.from ?? undefined}
          onChange={(to) => set({ to })}
          slotProps={{ field: { clearable: true }, textField: { size: "small" } }}
          value={state.to}
        />
        <TextField label="Kết quả" onChange={(event) => set({ result: event.target.value as AccessLogFilterState["result"] })} select size="small" value={state.result}>
          <MenuItem value="">Tất cả kết quả</MenuItem>
          {RESULT_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
        </TextField>
        <TextField label="Nguồn sự kiện" onChange={(event) => set({ sourceType: event.target.value as AccessLogFilterState["sourceType"] })} select size="small" value={state.sourceType}>
          {SOURCE_OPTIONS.map((option) => <MenuItem key={option.value || "all"} value={option.value}>{option.label}</MenuItem>)}
        </TextField>
      </Box>
    </LocalizationProvider>
  );
}
