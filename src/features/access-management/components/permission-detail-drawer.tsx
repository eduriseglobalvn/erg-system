import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { usePermissionDetail } from "@/features/access-management/hooks/use-access-management";
import { ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";

export function PermissionDetailDrawer({
  onClose,
  permissionId,
  tenantId,
}: {
  onClose: () => void;
  permissionId?: string;
  tenantId: string;
}) {
  const query = usePermissionDetail(tenantId, permissionId);

  return (
    <Drawer
      anchor="right"
      open={Boolean(permissionId)}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            bgcolor: "#FBFBFD",
            borderRadius: { sm: "20px 0 0 20px" },
            boxShadow: "0 20px 48px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06)",
            p: 3,
            width: { xs: "100%", sm: 460 },
          },
        },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 2.5 }}>
        <Box>
          <Typography
            sx={{
              color: "#86868B",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Chi tiết quyền
          </Typography>
          <Typography
            sx={{
              color: "#1D1D1F",
              fontSize: "1.2rem",
              fontWeight: 800,
              letterSpacing: "-0.015em",
            }}
          >
            {query.data?.label ?? permissionId ?? "Quyền hệ thống"}
          </Typography>
        </Box>
        <IconButton
          aria-label="Đóng chi tiết quyền"
          onClick={onClose}
          sx={{
            bgcolor: "rgba(0, 0, 0, 0.05)",
            color: "#1D1D1F",
            height: 32,
            width: 32,
            "&:hover": { bgcolor: "rgba(0, 0, 0, 0.09)", transform: "scale(1.05)" },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {query.isPending ? <ErgLoadingSkeleton rows={6} /> : null}

      {query.isError ? (
        <ErgErrorState
          action={<Button onClick={() => void query.refetch()}>Thử lại</Button>}
          description="Kiểm tra lại quyền quản trị hoặc thử lại."
          title="Không tải được quyền"
        />
      ) : null}

      {query.data ? (
        <Box sx={{ display: "grid", gap: 2.5 }}>
          {/* Hero Identification Card */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              p: 2.25,
            }}
          >
            <Typography sx={{ color: "#86868B", fontSize: "0.75rem", fontWeight: 600 }}>
              Permission Key
            </Typography>
            <Typography
              sx={{
                color: "#1D1D1F",
                fontFamily: "var(--font-mono)",
                fontSize: "0.95rem",
                fontWeight: 700,
                mt: 0.25,
              }}
            >
              {query.data.name}
            </Typography>
            {query.data.description ? (
              <Typography sx={{ color: "#6E6E73", fontSize: "0.825rem", mt: 0.5 }}>
                {query.data.description}
              </Typography>
            ) : null}

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: query.data.status === "ACTIVE" ? "rgba(52, 199, 89, 0.12)" : "rgba(255, 149, 0, 0.12)",
                  border: `1px solid ${query.data.status === "ACTIVE" ? "rgba(52, 199, 89, 0.22)" : "rgba(255, 149, 0, 0.22)"}`,
                  borderRadius: "9999px",
                  color: query.data.status === "ACTIVE" ? "#15803D" : "#B45309",
                  display: "inline-flex",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  gap: 0.5,
                  px: 1,
                  py: 0.35,
                }}
              >
                <Box
                  sx={{
                    bgcolor: query.data.status === "ACTIVE" ? "#34C759" : "#FF9500",
                    borderRadius: "50%",
                    height: 6,
                    width: 6,
                  }}
                />
                {query.data.status}
              </Box>

              <Box
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                  borderRadius: "9999px",
                  color: "#6E6E73",
                  fontSize: "0.72rem",
                  fontWeight: 650,
                  px: 1,
                  py: 0.35,
                }}
              >
                {query.data.used ? "Đang dùng" : "Chưa dùng"}
              </Box>

              <Box
                sx={{
                  bgcolor: "rgba(0, 113, 227, 0.08)",
                  borderRadius: "9999px",
                  color: "#0071E3",
                  fontSize: "0.72rem",
                  fontWeight: 650,
                  px: 1,
                  py: 0.35,
                }}
              >
                {query.data.roleCount} role
              </Box>

              <Box
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                  borderRadius: "9999px",
                  color: "#6E6E73",
                  fontSize: "0.72rem",
                  fontWeight: 650,
                  px: 1,
                  py: 0.35,
                }}
              >
                {query.data.userCount} user
              </Box>
            </Box>
          </Box>

          {/* Roles Using this Permission */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              p: 2.25,
            }}
          >
            <Typography sx={{ color: "#1D1D1F", fontSize: "0.85rem", fontWeight: 750, mb: 1.25 }}>
              Nhóm quyền đang sử dụng
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {query.data.roleNames?.length ? (
                query.data.roleNames.map((role) => (
                  <Box
                    key={role}
                    sx={{
                      bgcolor: "rgba(0, 113, 227, 0.08)",
                      border: "1px solid rgba(0, 113, 227, 0.18)",
                      borderRadius: "8px",
                      color: "#0071E3",
                      fontSize: "0.78rem",
                      fontWeight: 650,
                      px: 1.25,
                      py: 0.45,
                    }}
                  >
                    {role}
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary" variant="body2" sx={{ fontSize: "0.825rem" }}>
                  Chưa có role nào chứa quyền này.
                </Typography>
              )}
            </Box>
          </Box>

          {/* Bindings Card */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              p: 2.25,
            }}
          >
            <Typography sx={{ color: "#1D1D1F", fontSize: "0.85rem", fontWeight: 750, mb: 1.25 }}>
              Binding đang bảo vệ ({query.data.bindings.length})
            </Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {query.data.bindings.map((binding) => (
                <Box
                  key={binding.id}
                  sx={{
                    bgcolor: "rgba(0, 0, 0, 0.02)",
                    borderRadius: "10px",
                    border: "1px solid rgba(0, 0, 0, 0.04)",
                    p: 1.5,
                  }}
                >
                  <Box sx={{ alignItems: "center", display: "flex", gap: 0.5, mb: 0.25 }}>
                    <ShieldRoundedIcon sx={{ color: "#0071E3", fontSize: 14 }} />
                    <Typography sx={{ color: "#86868B", fontSize: "0.72rem", fontWeight: 600 }}>
                      {binding.surfaceType}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: "#1D1D1F", fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 650 }}>
                    {binding.surfaceIdentifier}
                  </Typography>
                  <Typography sx={{ color: "#6E6E73", fontSize: "0.78rem", mt: 0.25 }}>
                    {binding.description || "Binding runtime"}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Typography sx={{ color: "#86868B", fontSize: "0.72rem", fontStyle: "italic", lineHeight: 1.4 }}>
            Mọi thay đổi membership của quyền trong role được ghi vào activity/security feed cùng actor, request ID và authz version.
          </Typography>
        </Box>
      ) : null}
    </Drawer>
  );
}
