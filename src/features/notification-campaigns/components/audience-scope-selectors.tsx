import Autocomplete from "@mui/material/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Typography from "@mui/material/Typography";

import { ErgTextField } from "@/components/erg-mui";

import { type AudienceOption, useAudienceDirectory } from "../api/use-audience-directory";
import { type AudienceDraft, type AudienceRole, ROLE_LABELS } from "../model/audience-draft";
import type { ComposePortalKind } from "../model/campaign-paths";

type ListKey = "schoolIds" | "gradeIds" | "classIds" | "groupIds";

const LISTS: Partial<Record<AudienceDraft["scope"], { key: ListKey; label: string; options: keyof Pick<ReturnType<typeof useAudienceDirectory>, "schools" | "grades" | "classes" | "groups"> }>> = {
  SCHOOL: { key: "schoolIds", label: "Chọn trường", options: "schools" },
  GRADE: { key: "gradeIds", label: "Chọn khối", options: "grades" },
  CLASS: { key: "classIds", label: "Chọn lớp", options: "classes" },
  GROUP: { key: "groupIds", label: "Chọn nhóm học sinh", options: "groups" },
};

const ROLES: AudienceRole[] = ["TEACHER", "STUDENT", "STAFF"];

type Props = { draft: AudienceDraft; kind: ComposePortalKind; onChange: (draft: AudienceDraft) => void };

/** Which school / grade / class / role / group, for the active "Gửi đến" scope. */
export function AudienceScopeSelectors({ draft, kind, onChange }: Props) {
  const directory = useAudienceDirectory(kind, draft.scope);
  if (draft.scope === "TENANT") return <Typography color="text.secondary" variant="body2">Gửi cho mọi người có tài khoản trong hệ thống.</Typography>;
  if (draft.scope === "ROLE") {
    const toggle = (role: AudienceRole, on: boolean) =>
      onChange({ ...draft, roles: on ? [...draft.roles, role] : draft.roles.filter((r) => r !== role) });
    return (
      <FormGroup aria-label="Vai trò nhận" row>
        {ROLES.map((role) => (
          <FormControlLabel
            control={<Checkbox checked={draft.roles.includes(role)} onChange={(_, on) => toggle(role, on)} />}
            key={role}
            label={ROLE_LABELS[role]}
          />
        ))}
      </FormGroup>
    );
  }
  const list = LISTS[draft.scope];
  if (!list) return null;
  const options = directory[list.options];
  const known = new Map(options.map((o) => [o.id, o]));
  // Ids saved in a draft stay visible before (or without) their option loading.
  const value = draft[list.key].map((id) => known.get(id) ?? { id, label: id });
  const failed = Boolean(directory.error);
  return (
    <Autocomplete<AudienceOption, true>
      filterSelectedOptions
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      loading={directory.loading}
      loadingText="Đang tải…"
      multiple
      noOptionsText={kind === "teacher" && draft.scope === "CLASS" ? "Chưa có lớp nào bạn dạy" : "Không có lựa chọn"}
      onChange={(_, next) => onChange({ ...draft, [list.key]: next.map((o) => o.id) })}
      options={options}
      renderInput={(params) => (
        <ErgTextField
          {...params}
          error={failed}
          helperText={failed ? "Không tải được danh sách. Thử lại sau." : undefined}
          label={list.label}
        />
      )}
      value={value}
    />
  );
}
