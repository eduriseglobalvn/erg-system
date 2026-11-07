import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { usePolicy, useSites } from "../../api/timekeeping-config-query";
import { useTimekeepingSchools } from "../../api/timekeeping-admin-query";
import { SchoolFilter } from "../school-filter";
import { useAdminSearch } from "../use-admin-search";
import { SettingsForm } from "./settings-form";

const NEW_SITE = "new";

function Frame({ children, filter }: { children: ReactNode; filter?: ReactNode }) {
  return (
    <Box sx={{ display: "grid", gap: 2, px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgPageHeader description="Áp dụng theo cơ sở · thay đổi có hiệu lực từ kỳ công tiếp theo" title="Cấu hình chấm công" />
      {filter}
      {children}
    </Box>
  );
}

type SchoolSettingsProps = { schoolId: string; schoolName: string; filter: ReactNode };

/** Loads one school's sites and policy. Remounted per school so the edited site and unsaved values never leak across schools. */
function SchoolSettings({ filter, schoolId, schoolName }: SchoolSettingsProps) {
  const policy = usePolicy(schoolId);
  const sites = useSites(schoolId);
  const [picked, setPicked] = useState<string | null>(null);
  const retry = <ErgButton onClick={() => { void policy.refetch(); void sites.refetch(); }} variant="outlined">Tải lại</ErgButton>;

  if (policy.isError || sites.isError) {
    return <Frame filter={filter}><ErgErrorState action={retry} description="Không tải được cấu hình chấm công của cơ sở này." title="Có lỗi xảy ra" /></Frame>;
  }
  if (!policy.data || !sites.data) return <Frame filter={filter}><ErgSkeleton height={320} /></Frame>;

  const items = sites.data.filter((site) => site.active !== false);
  const selectedId = picked === NEW_SITE ? undefined : (items.find((site) => site.id === picked) ?? items[0])?.id;
  return (
    <SettingsForm
      onSelect={(id) => setPicked(id ?? NEW_SITE)}
      schoolFilter={filter}
      schoolId={schoolId}
      schoolName={schoolName}
      selectedId={selectedId}
      sites={items}
      versions={policy.data}
    />
  );
}

/** A04: configuration of one school (`?schoolId=`): sites and punch methods, shifts, policy, approval chains, holidays. */
export function TimekeepingSettingsPage() {
  const { search, update } = useAdminSearch("/employees/timekeeping-settings");
  const schools = useTimekeepingSchools();
  const schoolId = search.schoolId ?? schools.data?.[0]?.id ?? "";

  if (schools.isError) {
    return <Frame><ErgErrorState action={<ErgButton onClick={() => void schools.refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được danh sách cơ sở." title="Có lỗi xảy ra" /></Frame>;
  }
  if (schools.isPending) return <Frame><ErgSkeleton height={320} /></Frame>;
  if (!schoolId) return <Frame><ErgEmptyState description="Tạo cơ sở trước khi cấu hình chấm công." title="Chưa có cơ sở" /></Frame>;

  const filter = <SchoolFilter onChange={(next) => update({ schoolId: next })} schools={schools.data ?? []} value={schoolId} />;
  const schoolName = schools.data?.find((school) => school.id === schoolId)?.name ?? "";
  return <SchoolSettings filter={filter} key={schoolId} schoolId={schoolId} schoolName={schoolName} />;
}
