import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import { usePermissionDetail } from "@/features/access-management/hooks/use-access-management";
import { ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";

export function PermissionDetailDrawer({ tenantId, permissionId, onClose }: {
  tenantId: string;
  permissionId?: string;
  onClose: () => void;
}) {
  const query = usePermissionDetail(tenantId, permissionId);
  return (
    <Drawer anchor="right" open={Boolean(permissionId)} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 460 }, p: 3 } } }}>
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">Chi tiết quyền</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{query.data?.label ?? permissionId ?? "Quyền hệ thống"}</Typography>
        </Box>
        <IconButton aria-label="Đóng chi tiết quyền" onClick={onClose}><CloseRoundedIcon /></IconButton>
      </Box>
      {query.isPending ? <ErgLoadingSkeleton rows={6} /> : null}
      {query.isError ? <ErgErrorState title="Không tải được quyền" description="Kiểm tra lại quyền quản trị hoặc thử lại." action={<Button onClick={() => void query.refetch()}>Thử lại</Button>} /> : null}
      {query.data ? (
        <Box sx={{ display: "grid", gap: 2.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Permission key</Typography>
            <Typography sx={{ fontFamily: "monospace", fontWeight: 700 }}>{query.data.name}</Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip label={query.data.status} color={query.data.status === "ACTIVE" ? "success" : "warning"} size="small" />
            <Chip label={query.data.used ? "Đang dùng" : "Chưa dùng"} size="small" variant="outlined" />
            <Chip label={`${query.data.roleCount} role`} size="small" variant="outlined" />
            <Chip label={`${query.data.userCount} user`} size="small" variant="outlined" />
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Nhóm quyền đang sử dụng</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>{query.data.roleNames?.length ? query.data.roleNames.map((role) => <Chip key={role} label={role} size="small" variant="outlined" />) : <Typography color="text.secondary" variant="body2">Chưa có role chứa quyền này.</Typography>}</Box>
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Binding đang bảo vệ</Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {query.data.bindings.map((binding) => (
                <Box key={binding.id} sx={{ bgcolor: "action.hover", borderRadius: 2, p: 1.25 }}>
                  <Typography variant="caption" color="text.secondary">{binding.surfaceType}</Typography>
                  <Typography sx={{ fontFamily: "monospace", fontSize: 13 }}>{binding.surfaceIdentifier}</Typography>
                  <Typography variant="body2" color="text.secondary">{binding.description || "Binding runtime"}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <Typography color="text.secondary" variant="caption">Mọi thay đổi membership của quyền trong role được ghi vào activity/security feed cùng actor, request ID và authz version.</Typography>
        </Box>
      ) : null}
    </Drawer>
  );
}
