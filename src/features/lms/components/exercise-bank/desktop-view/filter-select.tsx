import { ErgSelect } from "@/components/erg-mui";
import { allExerciseFilter } from "../exercise-bank-model";

export function FilterSelect({
  value,
  onChange,
  label,
  values,
  labels,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  values: string[];
  labels?: Record<string, string>;
}) {
  const isFiltered = value !== allExerciseFilter && value !== "all";
  return (
    <ErgSelect
      size="small"
      fullWidth={false}
      value={value}
      onChange={(event) => onChange(String(event.target.value))}
      options={[{ value: allExerciseFilter, label }, ...values.map((item) => ({ value: item, label: labels?.[item] ?? item }))]}
      sx={{ minWidth: 120, "& .MuiSelect-select": { fontSize: 12, fontWeight: isFiltered ? 600 : 500, py: 0.75, color: isFiltered ? "primary.main" : "text.primary" } }}
    />
  );
}
