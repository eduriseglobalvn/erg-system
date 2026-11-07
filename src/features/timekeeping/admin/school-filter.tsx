import { ErgSelect } from "@/components/erg-mui/erg-form";

export type SchoolOption = { id: string; name: string };

type SchoolFilterProps = {
  schools: readonly SchoolOption[];
  value: string;
  onChange: (schoolId: string) => void;
  /** A01 may look at every school at once; A02 always works on one. */
  allowAll?: boolean;
};

/** "Cơ sở" filter. `schoolId` is the school id on the timekeeping admin endpoints. */
export function SchoolFilter({ allowAll = false, onChange, schools, value }: SchoolFilterProps) {
  const options = [...(allowAll ? [{ label: "Tất cả cơ sở", value: "" }] : []), ...schools.map((s) => ({ label: s.name, value: s.id }))];
  return (
    <ErgSelect
      onChange={(event) => onChange(event.target.value)}
      options={options}
      size="small"
      label="Cơ sở"
      sx={{ minWidth: 200, width: { xs: "100%", sm: 240 } }}
      value={options.some((option) => option.value === value) ? value : ""}
    />
  );
}
