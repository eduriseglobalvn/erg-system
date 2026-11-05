import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function scopeSelectSx({ minWidth, maxWidth, variant }: { minWidth: number; maxWidth?: number; variant: "title" | "pill" }) {
  const isTitle = variant === "title";
  return {
    background: isTitle ? "transparent" : "#FAFAFC",
    borderRadius: isTitle ? "8px" : "10px",
    minWidth,
    maxWidth: maxWidth ?? (isTitle ? 238 : minWidth + 54),
    transition: "background-color 160ms ease, box-shadow 160ms ease",
    "&:hover": {
      backgroundColor: isTitle ? "rgba(145,158,171,0.07)" : "#F4F6F8",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: isTitle ? "transparent" : "rgba(145,158,171,0.16)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: isTitle ? "rgba(0, 113, 227,0.10)" : "rgba(0, 113, 227,0.22)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0, 113, 227,0.30)",
      borderWidth: 1,
    },
    "&.Mui-focused": {
      boxShadow: "0 0 0 3px rgba(0, 113, 227,0.08)",
    },
    "& .MuiSelect-select": {
      alignItems: "center",
      display: "flex",
      height: 32,
      minHeight: "32px !important",
      pl: isTitle ? "8px !important" : "10px !important",
      pr: isTitle ? "28px !important" : "30px !important",
      py: 0,
    },
    "& .MuiSelect-icon": {
      color: "#637381",
      fontSize: 18,
      right: isTitle ? 6 : 7,
    },
  };
}

export const scopeMenuProps = {
  slotProps: {
    paper: {
      sx: {
        border: "1px solid rgba(145,158,171,0.14)",
        borderRadius: "12px",
        boxShadow: "0 18px 42px rgba(28,37,46,0.12)",
        mt: 1,
        p: 0.5,
        minWidth: 280,
        "& .MuiList-root": { p: 0 },
      },
    },
  },
};

export const scopeMenuItemSx = {
  alignItems: "center",
  borderRadius: `${ergEnterpriseTokens.radius.sm}px`,
  display: "flex",
  gap: 1.25,
  minHeight: 44,
  px: 1.25,
  py: 1,
  "&.Mui-selected": {
    bgcolor: "rgba(145,158,171,0.12)",
  },
  "&.Mui-selected:hover": {
    bgcolor: "rgba(145,158,171,0.16)",
  },
};

export const scopeMenuLogoSx = {
  alignItems: "center",
  background: "linear-gradient(135deg, #FEE2F1 0%, #DBEAFE 100%)",
  borderRadius: "50%",
  color: "#0071E3",
  display: "flex",
  flexShrink: 0,
  fontSize: 9,
  fontWeight: 600,
  height: 28,
  justifyContent: "center",
  width: 28,
};

export const scopeClassIconSx = {
  alignItems: "center",
  background: "linear-gradient(135deg, rgba(219,234,254,0.92) 0%, rgba(254,226,241,0.84) 100%)",
  border: "1px solid rgba(0, 113, 227,0.10)",
  borderRadius: "8px",
  display: "flex",
  flexShrink: 0,
  height: 24,
  justifyContent: "center",
  width: 24,
};
