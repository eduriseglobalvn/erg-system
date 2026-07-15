import { type ReactNode } from "react";
import { CheckCircle2, Search } from "@/components/mui-icon-shim";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { inputClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

export function StatusSelectField({
  value,
  onChange,
  taxonomy = false,
}: {
  value: string;
  onChange: (value: string) => void;
  taxonomy?: boolean;
}) {
  return (
    <Field label="Trạng thái">
      <AppSelect value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName}>
        <option value={taxonomy ? "active" : "published"}>Đã xuất bản</option>
        <option value="draft">Bản nháp</option>
        <option value="hidden">Đã ẩn</option>
      </AppSelect>
    </Field>
  );
}

export function ContentTextFields({
  titleLabel = "Tên hiển thị",
  titlePlaceholder,
  titleValue,
  onTitleChange,
  descriptionLabel = "Mô tả",
  descriptionPlaceholder,
  descriptionValue,
  onDescriptionChange,
  autoFocus = false,
}: {
  titleLabel?: string;
  titlePlaceholder?: string;
  titleValue: string;
  onTitleChange: (value: string) => void;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  descriptionValue: string;
  onDescriptionChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <>
      <Field label={titleLabel}>
        <TextField size="small" fullWidth value={titleValue} onChange={(event) => onTitleChange(event.target.value)} placeholder={titlePlaceholder} autoFocus={autoFocus} />
      </Field>
      <Field label={descriptionLabel}>
        <textarea
          value={descriptionValue}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder={descriptionPlaceholder}
          className={cn(inputClassName, "min-h-24 py-3")}
        />
      </Field>
    </>
  );
}

export function ContentLinkField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint?: string;
}) {
  return (
    <Field label={label}>
      <TextField size="small" fullWidth value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </Field>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <TextField
      size="small"
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search className="h-4 w-4 text-slate-400" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#e0e4ea] bg-white px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function ChecklistItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e0e4ea] bg-white px-4 py-3">
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
  );
}

export function PublishCard({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="text-xs font-semibold text-slate-500">{title}</div>
        <div className="mt-2 text-xl font-semibold text-slate-950">{value}</div>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}

export function PublishStep({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-[#e0e4ea] bg-white p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#ebf3fc] text-[var(--erg-blue)]">{icon}</span>
      <div className="mt-4 font-semibold text-slate-950">{title}</div>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
