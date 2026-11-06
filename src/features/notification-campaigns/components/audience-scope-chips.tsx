import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { KeyboardEvent } from "react";

import { type AudienceScope, SCOPE_LABELS } from "../model/audience-draft";

type Props = {
  /** Scopes the sender may use, in display order (see allowedScopes). */
  allowed: AudienceScope[];
  onChange: (scope: AudienceScope) => void;
  value: AudienceScope;
};

/** "Gửi đến" scope as a radiogroup: one tab stop, arrow keys move and select. */
export function AudienceScopeChips({ allowed, onChange, value }: Props) {
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const group = event.currentTarget;
    const next = allowed[(allowed.indexOf(value) + step + allowed.length) % allowed.length];
    if (!next) return;
    onChange(next);
    queueMicrotask(() => group.querySelector<HTMLElement>(`[data-scope="${next}"]`)?.focus());
  }

  return (
    <Stack aria-label="Gửi đến" direction="row" onKeyDown={onKeyDown} role="radiogroup" sx={{ flexWrap: "wrap", gap: 1 }}>
      {allowed.map((scope) => (
        <Chip
          aria-checked={scope === value}
          clickable
          color={scope === value ? "primary" : "default"}
          data-scope={scope}
          key={scope}
          label={SCOPE_LABELS[scope]}
          onClick={() => onChange(scope)}
          role="radio"
          tabIndex={scope === value ? 0 : -1}
          variant={scope === value ? "filled" : "outlined"}
        />
      ))}
    </Stack>
  );
}
