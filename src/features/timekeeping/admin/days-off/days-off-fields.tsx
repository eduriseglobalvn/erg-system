import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { HolidayKind, HolidayPayMode, HolidayTeachingAction } from "../../api/timekeeping-types";
import { HOLIDAY_KIND_OPTIONS, PAY_MODE_OPTIONS, TEACHING_ACTION_OPTIONS, isPayLocked } from "./days-off-model";

const tokens = ergEnterpriseTokens;

type ChipChoiceProps<T extends string> = {
  label: string;
  value: T | null;
  options: ReadonlyArray<{ value: T; label: string; disabled?: boolean }>;
  onChange: (value: T) => void;
  disabled?: boolean;
};

/** Pill radio group of the days-off forms (board: 32px pills, selected = primary tint). */
export function ChipChoice<T extends string>({ disabled, label, onChange, options, value }: ChipChoiceProps<T>) {
  return (
    <Box aria-label={label} role="radiogroup" sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <ButtonBase
            aria-checked={checked}
            disabled={disabled || option.disabled}
            focusRipple
            key={option.value}
            onClick={() => { if (!checked) onChange(option.value); }}
            role="radio"
            sx={{
              bgcolor: checked ? tokens.color.primarySofter : tokens.color.surface,
              border: 1,
              borderColor: checked ? tokens.color.primary : tokens.color.border,
              borderRadius: `${tokens.radius.chip}px`,
              color: checked ? tokens.schedule.published.text : tokens.color.textSecondary,
              height: 32,
              px: 1.5,
              typography: checked ? "subtitle2" : "body2",
              "&.Mui-disabled": { opacity: checked ? 1 : 0.5 },
            }}
          >
            {option.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

export function FieldBlock({ children, hint, hintTone = "meta", label }: { children: ReactNode; hint?: string; hintTone?: "meta" | "warn"; label: string }) {
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <Typography color="text.secondary" component="span" variant="caption">{label}</Typography>
      {children}
      {hint ? <Typography component="span" sx={{ color: hintTone === "warn" ? tokens.schedule.warn.text : "text.disabled" }} variant="caption">{hint}</Typography> : null}
    </Box>
  );
}

export const KIND_HINT = "Lễ nhà nước và nghỉ bù nhập theo năm hoặc HR thêm; nghỉ công ty do HR thêm. Nghỉ bù tính là ngày nghỉ lễ.";
export const PAY_HINT = "Bắt buộc chọn, không có mặc định. Lễ nhà nước và nghỉ bù luôn có lương theo luật nên khoá ở «Có lương». Nghỉ công ty HR chọn từng lần: Có lương ghi L, tính 1 công; Trừ phép năm trừ 1 ngày phép (ai hết phép thì thành KL); Không lương ghi KL, không tính công. Ai vẫn được giao đi làm hôm đó thì tính công bình thường.";
export const ACTION_HINT = "Giáo viên thỉnh giảng tính công theo tiết dạy thật, nên tiết huỷ không có công.";

type HolidayFieldsProps = {
  kind: HolidayKind;
  payMode: HolidayPayMode | null;
  teachingAction: HolidayTeachingAction;
  onKind: (kind: HolidayKind) => void;
  onPayMode: (mode: HolidayPayMode) => void;
  onTeachingAction: (action: HolidayTeachingAction) => void;
  disabled?: boolean;
  /** The add form shows the shorter hints of its board. */
  compact?: boolean;
};

/** Loại · Tính lương · Tiết dạy: the three choices of a day off, shared by the card, the add dialog and the phone sheet. */
export function HolidayFields({ compact = false, disabled, kind, onKind, onPayMode, onTeachingAction, payMode, teachingAction }: HolidayFieldsProps) {
  const locked = isPayLocked(kind);
  return (
    <>
      <FieldBlock hint={compact ? "Nghỉ bù tính là ngày nghỉ lễ." : KIND_HINT} label={compact ? "Loại" : "Loại ngày nghỉ"}>
        <ChipChoice disabled={disabled} label="Loại ngày nghỉ" onChange={onKind} options={HOLIDAY_KIND_OPTIONS} value={kind} />
      </FieldBlock>
      <FieldBlock
        hint={compact ? "Bắt buộc chọn. Có lương (L): tính 1 công. Trừ phép năm (P): trừ 1 ngày phép, ai hết phép thì thành KL. Không lương (KL): không tính công. Lễ nhà nước và nghỉ bù khoá ở «Có lương»." : PAY_HINT}
        hintTone={compact && !locked && !payMode ? "warn" : "meta"}
        label={compact ? "Tính lương" : "Tính lương ngày này"}
      >
        <ChipChoice
          disabled={disabled}
          label="Tính lương ngày này"
          onChange={onPayMode}
          options={PAY_MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label, disabled: locked && option.value !== "PAID" }))}
          value={locked ? "PAID" : payMode}
        />
      </FieldBlock>
      <FieldBlock hint={ACTION_HINT} label={compact ? "Tiết dạy" : "Tiết dạy trong ngày"}>
        <ChipChoice disabled={disabled} label="Tiết dạy trong ngày" onChange={onTeachingAction} options={TEACHING_ACTION_OPTIONS} value={teachingAction} />
      </FieldBlock>
    </>
  );
}

export function AffectedNotice({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ bgcolor: tokens.schedule.warn.bg, borderRadius: `${tokens.radius.control}px`, color: tokens.schedule.warn.text, px: 1.25, py: 1 }}>
      <Typography component="p" variant="body2">{children}</Typography>
    </Box>
  );
}
