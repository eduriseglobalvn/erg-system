import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { useEmployees } from "@/features/employee-management/hooks/use-employee-management";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getDefaultTenantId } from "@/lib/graphql-client";

type PersonPickerProps = {
  value: readonly string[];
  onChange: (ids: string[]) => void;
  /** Names are only known for people picked in this session; saved ids without a name show as a count. */
  names: Record<string, string>;
  onName: (id: string, name: string) => void;
};

/** "Chọn người": debounced search over the employee list, tick to add, chip to remove. */
export function PersonPicker({ names, onChange, onName, value }: PersonPickerProps) {
  const [q, setQ] = useState("");
  const search = useDebouncedValue(q.trim(), 300);
  const result = useEmployees(getDefaultTenantId(), { page: 1, limit: 8, search: search || undefined, status: "ACTIVE" });
  const people = result.data?.users ?? [];
  const toggle = (id: string, name: string) => {
    onName(id, name);
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Typography id="person-picker-label" variant="subtitle2">Chọn người</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {value.map((id) => (
          <Chip key={id} label={names[id] ?? `Nhân sự …${id.slice(-4)}`} onDelete={() => onChange(value.filter((v) => v !== id))} size="small" />
        ))}
      </Box>
      <ErgSearchField onChange={(event) => setQ(event.target.value)} placeholder="Tìm theo tên hoặc email" slotProps={{ htmlInput: { "aria-labelledby": "person-picker-label" } }} value={q} />
      {result.isError ? <Typography color="error" role="alert" variant="body2">Không tải được danh sách nhân sự.</Typography> : null}
      <Box sx={{ display: "grid", maxHeight: 220, overflowY: "auto" }}>
        {people.map((person) => (
          <FormControlLabel
            control={<Checkbox checked={value.includes(person.id)} onChange={() => toggle(person.id, person.fullName)} />}
            key={person.id}
            label={`${person.fullName} · ${person.email}`}
          />
        ))}
        {!result.isPending && people.length === 0 ? <Typography color="text.secondary" variant="body2">Không tìm thấy nhân sự.</Typography> : null}
      </Box>
    </Box>
  );
}
