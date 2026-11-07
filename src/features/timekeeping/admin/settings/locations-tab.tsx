import { useState, type ReactNode } from "react";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { useDeleteSite } from "../../api/timekeeping-config-query";
import type { SiteConfig } from "../../api/timekeeping-types";
import { DeleteConfirm } from "./delete-confirm";
import { MethodsPanel } from "./methods-panel";
import { RemoteWorkPanel } from "./remote-work-panel";
import type { SiteForm } from "./settings-model";
import { SiteEditor } from "./site-editor";

type LocationsTabProps = {
  schoolId: string;
  sites: readonly SiteConfig[];
  /** Id of the site being edited; undefined while a new site is being filled in. */
  selectedId: string | undefined;
  site: SiteForm;
  siteDirty: boolean;
  onSelect: (id: string | undefined) => void;
  onSiteChange: (patch: Partial<SiteForm>) => void;
  onDeleted: (id: string) => void;
  requireFace: boolean;
  allowOutside: boolean;
  onMethodsChange: (patch: { requireFace?: boolean; allowOutside?: boolean }) => void;
};

function Section({ children, title }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ display: "grid", gap: 1.5 }}>
      <Typography component="h3" variant="subtitle2">{title}</Typography>
      {children}
    </Box>
  );
}

/** "Địa điểm & phương thức": site list + editor, punch methods and remote work. */
export function LocationsTab(props: LocationsTabProps) {
  const { allowOutside, onDeleted, onMethodsChange, onSelect, onSiteChange, requireFace, schoolId, selectedId, site, siteDirty, sites } = props;
  const remove = useDeleteSite();
  const [deleting, setDeleting] = useState<SiteConfig | null>(null);
  const current = sites.find((s) => s.id === selectedId);
  // One site is edited at a time; switching is held back until the edit is saved or cancelled.
  const locked = siteDirty;
  const removeAndSelect = {
    ...remove,
    mutate: (id: string, options: { onSuccess: () => void }) => remove.mutate(id, { onSuccess: () => { options.onSuccess(); onDeleted(id); } }),
  };

  return (
    <Box sx={{ display: "grid", gap: 4 }}>
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "260px 1fr" } }}>
        <Box sx={{ alignContent: "start", display: "grid", gap: 1 }}>
          {sites.map((item) => (
            <ButtonBase
              aria-current={item.id === selectedId ? "true" : undefined}
              disabled={locked && item.id !== selectedId}
              key={item.id}
              onClick={() => onSelect(item.id)}
              sx={{ alignItems: "flex-start", bgcolor: item.id === selectedId ? "action.selected" : "transparent", border: 1, borderColor: "divider", borderRadius: 2, display: "grid", p: 1.5, textAlign: "left", "&.Mui-disabled": { opacity: 0.5 } }}
            >
              <Typography variant="subtitle2">{item.name}</Typography>
              <Typography color="text.secondary" variant="caption">{[item.address, `bán kính ${item.radiusM} m`].filter(Boolean).join(" · ")}</Typography>
            </ButtonBase>
          ))}
          <ErgButton disabled={locked || (!selectedId && sites.length === 0)} onClick={() => onSelect(undefined)} startIcon={<AddIcon />} variant="outlined">Thêm</ErgButton>
          {locked ? <Typography color="text.secondary" variant="caption">Lưu hoặc huỷ thay đổi địa điểm trước khi chọn địa điểm khác.</Typography> : null}
        </Box>
        <SiteEditor onChange={onSiteChange} onDelete={current ? () => setDeleting(current) : undefined} showErrors={siteDirty} value={site} />
      </Box>
      <Section title="Phương thức chấm công">
        <MethodsPanel allowOutside={allowOutside} onChange={onMethodsChange} requireFace={requireFace} />
      </Section>
      <RemoteWorkPanel schoolId={schoolId} />
      {deleting?.id ? (
        <DeleteConfirm
          description="Địa điểm đã có dữ liệu chấm công chỉ ngừng áp dụng, lịch sử vẫn giữ nguyên."
          id={deleting.id}
          mutation={removeAndSelect}
          onClose={() => { remove.reset(); setDeleting(null); }}
          title={`Xoá địa điểm ${deleting.name}?`}
        />
      ) : null}
    </Box>
  );
}
