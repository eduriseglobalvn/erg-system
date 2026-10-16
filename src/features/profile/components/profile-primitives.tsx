import Eye from "@mui/icons-material/VisibilityRounded";
import EyeOff from "@mui/icons-material/VisibilityOffRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import type { ReactNode } from "react";
import type { ProfileNotice as Notice } from "@/features/profile/types/profile-types";

export function SectionHeader({ action, description, eyebrow, icon, title }: { action?: ReactNode; description: string; eyebrow: string; icon: ReactNode; title: string }) {
  return (
    <Box component="div" sx={{"display":"flex","flexDirection":"column","gap":"calc(0.25rem * 4)","borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","paddingBottom":"calc(0.25rem * 5)","@media (min-width: 48rem)":{"flexDirection":"row","alignItems":"flex-start","justifyContent":"space-between"}}}>
      <Box component="div" sx={{"display":"flex","gap":"calc(0.25rem * 3)"}}>
        <Box component="div" sx={{"display":"grid","width":"calc(0.25rem * 11)","height":"calc(0.25rem * 11)","flexShrink":"0","placeItems":"center","borderRadius":"0.5rem","backgroundColor":"var(--erg-blue-light)","color":"var(--erg-blue)"}}>{icon}</Box>
        <div>
          <Box component="p" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"var(--erg-red)"}}>{eyebrow}</Box>
          <Box component="h2" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"1rem","lineHeight":"calc(1.5 / 1)","fontWeight":"600","color":"oklch(12.9% 0.042 264.695)"}}>{title}</Box>
          <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","maxWidth":"42rem","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(55.4% 0.046 257.417)"}}>{description}</Box>
        </div>
      </Box>
      {action ? <Box component="div" sx={{"flexShrink":"0"}}>{action}</Box> : null}
    </Box>
  );
}

export function Field({ children, fullWidth = false, icon, label }: { children: ReactNode; fullWidth?: boolean; icon: ReactNode; label: string }) {
  return (
    <Box component="label" sx={{ gridColumn: fullWidth ? { md: "1 / -1" } : undefined }}>
      <Box component="span" sx={{"marginBottom":"calc(0.25rem * 2)","display":"flex","alignItems":"center","gap":"calc(0.25rem * 2)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>
        {icon}
        {label}
      </Box>
      {children}
    </Box>
  );
}

export function PasswordInput({ disabled, onChange, onToggle, placeholder, show, type, value }: {
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  placeholder: string;
  show: boolean;
  type: "password" | "text";
  value: string;
}) {
  return (
    <Box sx={{ position: "relative" }}>
      <TextField fullWidth size="small" disabled={disabled} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} sx={{ "& .MuiInputBase-input": { pr: 6 } }} />
      <IconButton
        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        sx={{"position":"absolute","right":"calc(0.25rem * 2)","top":"calc(1 / 2 * 100%)","display":"grid","width":"calc(0.25rem * 8)","height":"calc(0.25rem * 8)","translate":"0 calc(calc(1 / 2 * 100%) * -1)","placeItems":"center","borderRadius":"0.5rem","color":"oklch(55.4% 0.046 257.417)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media (hover: hover)":{"backgroundColor":"oklch(96.8% 0.007 247.896)","color":"oklch(20.8% 0.042 265.755)"}}}}
        size="small"
        onClick={onToggle}
      >
        {show ? <EyeOff sx={{ fontSize: 16 }} /> : <Eye sx={{ fontSize: 16 }} />}
      </IconButton>
    </Box>
  );
}

export function ProfileTabButton({ active, description, icon, onClick, title }: { active: boolean; description: string; icon: ReactNode; onClick: () => void; title: string }) {
  return (
    <Box component="button"
      sx={{ alignItems: "center", bgcolor: active ? "var(--erg-blue-light)" : "background.paper", border: "1px solid", borderColor: active ? "primary.main" : "transparent", borderRadius: 1, boxShadow: active ? 1 : 0, color: active ? "primary.main" : "text.secondary", display: "flex", gap: 1.5, px: 2, py: 1.5, textAlign: "left", transition: "background-color 160ms ease, border-color 160ms ease", "&:hover": active ? {} : { bgcolor: "background.default", borderColor: "divider" } }}
      type="button"
      onClick={onClick}
    >
      <Box component="span" sx={{ bgcolor: active ? "background.paper" : "background.default", borderRadius: 1, display: "grid", height: 36, placeItems: "center", width: 36 }}>{icon}</Box>
      <Box component="span" sx={{"minWidth":"calc(0.25rem * 0)"}}>
        <Box component="span" sx={{"display":"block","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600"}}>{title}</Box>
        <Box component="span" sx={{"marginTop":"calc(0.25rem * 0.5)","display":"block","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"500","color":"oklch(55.4% 0.046 257.417)"}}>{description}</Box>
      </Box>
    </Box>
  );
}

export function NoticeBox({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return (
    <Box sx={{ bgcolor: notice.tone === "success" ? "success.50" : "error.50", border: "1px solid", borderColor: notice.tone === "success" ? "success.light" : "error.light", borderRadius: 1, color: notice.tone === "success" ? "success.dark" : "error.dark", fontSize: 14, fontWeight: 700, mt: 2.5, px: 2, py: 1.5 }}>
      {notice.message}
    </Box>
  );
}

export function ProfileLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 3)","borderRadius":"0.5rem","backgroundColor":"oklch(98.4% 0.003 247.858)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 2)"}}>
      <Box component="span" sx={{"color":"var(--erg-blue)"}}>{icon}</Box>
      <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)","flex":"1"}}>
        <Box component="p" sx={{"fontSize":"11px","fontWeight":"500","color":"oklch(70.4% 0.04 256.788)"}}>{label}</Box>
        <Box component="p" sx={{"overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(20.8% 0.042 265.755)"}}>{value}</Box>
      </Box>
    </Box>
  );
}

export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)"}}>
      <Box component="p" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"500","color":"oklch(70.4% 0.04 256.788)"}}>{label}</Box>
      <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(12.9% 0.042 264.695)"}}>{value}</Box>
    </Box>
  );
}
