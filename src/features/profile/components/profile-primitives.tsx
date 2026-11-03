import Eye from "@mui/icons-material/VisibilityRounded";
import EyeOff from "@mui/icons-material/VisibilityOffRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import type { ProfileNotice as Notice } from "@/features/profile/types/profile-types";

export function SectionHeader({
  action,
  description,
  eyebrow,
  icon,
  title,
}: {
  action?: ReactNode;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Box
      sx={{
        alignItems: { xs: "flex-start", md: "center" },
        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
        justifyContent: "space-between",
        pb: 2.5,
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.75 }}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "rgba(0, 113, 227, 0.08)",
            borderRadius: "12px",
            color: "#0071E3",
            display: "flex",
            flexShrink: 0,
            height: 44,
            justifyContent: "center",
            width: 44,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography
            sx={{
              color: "#86868B",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Typography>
          <Typography
            sx={{
              color: "#1D1D1F",
              fontSize: "1.15rem",
              fontWeight: 800,
              letterSpacing: "-0.015em",
              mt: 0.25,
            }}
          >
            {title}
          </Typography>
          <Typography sx={{ color: "#6E6E73", fontSize: "0.825rem", mt: 0.35 }}>
            {description}
          </Typography>
        </Box>
      </Box>
      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Box>
  );
}

export function Field({
  children,
  fullWidth = false,
  icon,
  label,
}: {
  children: ReactNode;
  fullWidth?: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Box sx={{ gridColumn: fullWidth ? { md: "1 / -1" } : undefined }}>
      <Box sx={{ alignItems: "center", color: "#6E6E73", display: "flex", gap: 0.75, mb: 1 }}>
        <Box sx={{ color: "#86868B", display: "flex" }}>{icon}</Box>
        <Typography sx={{ color: "#4B5563", fontSize: "0.825rem", fontWeight: 650 }}>
          {label}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

export function PasswordInput({
  disabled,
  onChange,
  onToggle,
  placeholder,
  show,
  type,
  value,
}: {
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
      <TextField
        disabled={disabled}
        fullWidth
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        size="small"
        type={type}
        value={value}
        sx={{
          "& .MuiOutlinedInput-root": {
            bgcolor: "#FFFFFF",
            borderRadius: "10px",
            fontSize: "0.85rem",
            fontWeight: 550,
            pr: 5,
            "& fieldset": { borderColor: "rgba(0, 0, 0, 0.12)" },
            "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.22)" },
            "&.Mui-focused fieldset": {
              borderColor: "#0071E3",
              boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.15)",
            },
          },
        }}
      />
      <IconButton
        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        onClick={onToggle}
        size="small"
        sx={{
          color: "#86868B",
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          transition: "all 0.15s ease",
          "&:hover": { bgcolor: "rgba(0, 0, 0, 0.05)", color: "#1D1D1F" },
        }}
      >
        {show ? <EyeOff sx={{ fontSize: 16 }} /> : <Eye sx={{ fontSize: 16 }} />}
      </IconButton>
    </Box>
  );
}

export function ProfileTabButton({
  active,
  description,
  icon,
  onClick,
  title,
}: {
  active: boolean;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      type="button"
      sx={{
        alignItems: "center",
        bgcolor: active ? "rgba(0, 113, 227, 0.08)" : "#FFFFFF",
        border: `1px solid ${active ? "rgba(0, 113, 227, 0.18)" : "rgba(0, 0, 0, 0.06)"}`,
        borderRadius: "14px",
        boxShadow: active ? "0 2px 8px rgba(0, 113, 227, 0.08)" : "0 1px 3px rgba(0, 0, 0, 0.02)",
        color: active ? "#0071E3" : "#6E6E73",
        cursor: "pointer",
        display: "flex",
        gap: 1.5,
        p: 1.75,
        textAlign: "left",
        transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        width: "100%",
        "&:hover": {
          bgcolor: active ? "rgba(0, 113, 227, 0.12)" : "rgba(0, 0, 0, 0.03)",
        },
        "&:active": {
          transform: "scale(0.985)",
        },
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          bgcolor: active ? "#0071E3" : "rgba(0, 0, 0, 0.05)",
          borderRadius: "10px",
          color: active ? "#FFFFFF" : "#6E6E73",
          display: "flex",
          flexShrink: 0,
          height: 38,
          justifyContent: "center",
          transition: "all 0.15s ease",
          width: 38,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: active ? "#0071E3" : "#1D1D1F",
            fontSize: "0.85rem",
            fontWeight: active ? 750 : 650,
          }}
        >
          {title}
        </Typography>
        <Typography
          noWrap
          sx={{
            color: active ? "rgba(0, 113, 227, 0.75)" : "#86868B",
            fontSize: "0.72rem",
            fontWeight: 500,
            mt: 0.25,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

export function NoticeBox({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  const isSuccess = notice.tone === "success";

  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: isSuccess ? "rgba(52, 199, 89, 0.1)" : "rgba(255, 59, 48, 0.1)",
        border: `1px solid ${isSuccess ? "rgba(52, 199, 89, 0.22)" : "rgba(255, 59, 48, 0.22)"}`,
        borderRadius: "12px",
        color: isSuccess ? "#15803D" : "#DC2626",
        display: "flex",
        fontSize: "0.85rem",
        fontWeight: 650,
        gap: 1,
        mt: 2.5,
        p: 1.75,
      }}
    >
      <Box
        sx={{
          bgcolor: isSuccess ? "#34C759" : "#FF3B30",
          borderRadius: "50%",
          flexShrink: 0,
          height: 6,
          width: 6,
        }}
      />
      {notice.message}
    </Box>
  );
}

export function ProfileLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "rgba(0, 0, 0, 0.025)",
        borderRadius: "10px",
        border: "1px solid rgba(0, 0, 0, 0.04)",
        display: "flex",
        gap: 1.25,
        p: 1.25,
      }}
    >
      <Box sx={{ color: "#0071E3", display: "flex" }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ color: "#86868B", fontSize: "0.7rem", fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography noWrap sx={{ color: "#1D1D1F", fontSize: "0.825rem", fontWeight: 650 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        bgcolor: "rgba(0, 0, 0, 0.02)",
        borderRadius: "12px",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        p: 1.75,
      }}
    >
      <Typography sx={{ color: "#86868B", fontSize: "0.72rem", fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography sx={{ color: "#1D1D1F", fontSize: "0.875rem", fontWeight: 700, mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  );
}
