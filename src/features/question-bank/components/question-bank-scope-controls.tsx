import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useState } from "react";

import { ErgIconButton } from "@/components/erg-mui/erg-actions";
import type { QuestionBankLevel, QuestionBankSubject } from "@/features/question-bank/types/question-bank-types";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { QuestionBankCopy } from "./question-bank-copy";
import { QUESTION_BANK_SELECT_MENU_PROPS } from "./question-bank-primitives";

/** Compact header select: a muted label then the value, on one 36px pill (canvas `.sel`). */
function ScopeSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <Select
      size="small"
      value={value}
      onChange={(event) => onChange(String(event.target.value))}
      MenuProps={QUESTION_BANK_SELECT_MENU_PROPS}
      inputProps={{ "aria-label": label }}
      renderValue={(selected) => (
        <Box component="span" sx={{ alignItems: "baseline", display: "inline-flex", gap: 1 }}>
          <Box component="span" sx={{ color: t.color.textMuted, typography: "caption" }}>{label}</Box>
          {options.find((option) => option.value === selected)?.label ?? ""}
        </Box>
      )}
      sx={{
        bgcolor: t.color.surface,
        borderRadius: `${t.radius.control}px`,
        height: t.size.controlSm,
        typography: "body2",
        "& .MuiOutlinedInput-notchedOutline": { borderColor: t.color.border },
      }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
}

/** Subject + level, chosen once in the page header of both the question bank and the quiz bank. */
export function QuestionBankScopeControls({
  activeLevel,
  activeSubject,
  copy,
  onLevelChange,
  onSubjectChange,
  subjects,
}: {
  activeLevel: QuestionBankLevel;
  activeSubject: QuestionBankSubject;
  copy: QuestionBankCopy;
  onLevelChange: (levelId: string) => void;
  onSubjectChange: (subjectId: string) => void;
  subjects: QuestionBankSubject[];
}) {
  return (
    <>
      <ScopeSelect
        label={copy.subjectLabel}
        value={activeSubject.id}
        onChange={onSubjectChange}
        options={subjects.map((subject) => ({ value: subject.id, label: subject.label }))}
      />
      <ScopeSelect
        label={copy.levelLabel}
        value={activeLevel.id}
        onChange={onLevelChange}
        options={activeSubject.levels.map((level) => ({ value: level.id, label: level.label }))}
      />
    </>
  );
}

/** The ⋯ button at a row's end; clicks stay inside so the row does not open. */
export function RowActionsMenu({
  items,
  label,
}: {
  items: Array<{ key: string; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }>;
  label: string;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <Box component="span" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <ErgIconButton label={label} size="small" onClick={(event) => setAnchor(event.currentTarget)}>
        <MoreHorizRoundedIcon fontSize="small" />
      </ErgIconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {items.map((item) => (
          <MenuItem
            key={item.key}
            disabled={item.disabled}
            onClick={() => { setAnchor(null); item.onClick(); }}
            sx={item.danger ? { color: t.color.danger } : undefined}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
