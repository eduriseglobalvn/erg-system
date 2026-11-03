import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgContentBand, ErgPageSurface } from "@/components/erg-mui/erg-layout";
import { ErgDataTableShell, ErgTable } from "@/components/erg-mui/erg-table";
import {
  AppleAvatar,
  appleDesign,
  AppleStatusBadge,
} from "@/features/employee-management/components/apple-ui-tokens";
import { useEmployeeSecurityFeed } from "@/features/employee-management/hooks/use-employee-management";
import type { SecurityFeedFilters, SecurityFeedItem } from "@/features/employee-management/types/employee-management";

const sourceOptions: Array<{ label: string; value: SecurityFeedFilters["sourceType"] | "" }> = [
  { label: "Tất cả nguồn", value: "" },
  { label: "Đăng nhập", value: "LOGIN_ATTEMPT" },
  { label: "Cảnh báo bảo mật", value: "SECURITY_EVENT" },
  { label: "Phiên đăng nhập", value: "SESSION" },
  { label: "Hoạt động quản trị", value: "USER_ACTIVITY" },
];

export function EmployeeAccessLogWorkspace({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sourceType, setSourceType] = useState<SecurityFeedFilters["sourceType"]>();
  const query = useEmployeeSecurityFeed(tenantId, { limit, page, sourceType });
  const rows = query.data?.items ?? [];

  return (
    <ErgContentBand sx={{ bgcolor: "#F5F5F7", py: { md: 4, xs: 2.5 } }}>
      {/* Apple Section Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ alignItems: "center", display: "inline-flex", gap: 0.6, mb: 0.5 }}>
          <Typography
            variant="overline"
            sx={{
              color: appleDesign.colors.blue,
              fontSize: "0.725rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            Quản lý
          </Typography>
        </Box>
        <Typography
          variant="h4"
          sx={{
            color: appleDesign.colors.textPrimary,
            fontWeight: 750,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
          }}
        >
          Nhật ký truy cập
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: appleDesign.colors.textSecondary,
            lineHeight: 1.5,
            maxWidth: 720,
            mt: 0.5,
          }}
        >
          Feed hợp nhất đăng nhập, session, cảnh báo bảo mật và thay đổi quyền của toàn bộ nhân sự.
        </Typography>
      </Box>

      {/* Apple Table Surface */}
      <ErgPageSurface
        flush
        sx={{
          bgcolor: "#FFFFFF",
          border: `1px solid ${appleDesign.colors.border}`,
          borderRadius: "18px",
          boxShadow: appleDesign.shadows.card,
          overflow: "hidden",
        }}
      >
        <ErgDataTableShell
          toolbar={
            <Box
              sx={{
                alignItems: { sm: "center", xs: "flex-start" },
                borderBottom: `1px solid ${appleDesign.colors.border}`,
                display: "flex",
                flexDirection: { sm: "row", xs: "column" },
                gap: 2,
                justifyContent: "space-between",
                p: { md: 2.5, xs: 2 },
              }}
            >
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: appleDesign.colors.textPrimary,
                    fontWeight: 750,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Hoạt động nhân sự
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: appleDesign.colors.textSecondary,
                    display: "block",
                    fontWeight: 500,
                  }}
                >
                  {query.data ? `${query.data.total} sự kiện` : "Đang tải dữ liệu"}
                </Typography>
              </Box>

              <TextField
                select
                size="small"
                label="Nguồn sự kiện"
                value={sourceType ?? ""}
                onChange={(event) => {
                  setSourceType((event.target.value || undefined) as SecurityFeedFilters["sourceType"]);
                  setPage(1);
                }}
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: "11px",
                      minWidth: 200,
                    },
                  },
                }}
              >
                {sourceOptions.map((option) => (
                  <MenuItem key={option.value || "all"} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          }
        >
          {query.isPending ? (
            <Box sx={{ p: 3 }}>
              <ErgLoadingSkeleton rows={8} />
            </Box>
          ) : null}

          {query.isError ? (
            <Box sx={{ p: 3 }}>
              <ErgErrorState
                title="Không tải được nhật ký truy cập"
                description="Kiểm tra quyền users.manage và kết nối tới security feed backend."
              />
            </Box>
          ) : null}

          {!query.isPending && !query.isError && rows.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <ErgEmptyState
                title="Chưa có sự kiện phù hợp"
                description="Thử đổi nguồn sự kiện hoặc chờ hoạt động đăng nhập mới."
              />
            </Box>
          ) : null}

          {!query.isPending && !query.isError && rows.length > 0 ? (
            <>
              <ErgTable aria-label="Nhật ký truy cập nhân sự">
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: "#FBFBFD",
                      "& th": {
                        borderBottom: `1px solid ${appleDesign.colors.border}`,
                        color: appleDesign.colors.textTertiary,
                        fontSize: "0.725rem",
                        fontWeight: 650,
                        letterSpacing: "0.06em",
                        py: 1.5,
                        textTransform: "uppercase",
                      },
                    }}
                  >
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Nhân sự</TableCell>
                    <TableCell>Sự kiện</TableCell>
                    <TableCell>Nền tảng & địa chỉ</TableCell>
                    <TableCell>Kết quả</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((event) => (
                    <SecurityFeedRow event={event} key={`${event.sourceType}:${event.id}`} />
                  ))}
                </TableBody>
              </ErgTable>
              <TablePagination
                component="div"
                count={query.data?.total ?? 0}
                labelRowsPerPage="Số dòng"
                onPageChange={(_, nextPage) => setPage(nextPage + 1)}
                onRowsPerPageChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
                page={page - 1}
                rowsPerPage={limit}
                rowsPerPageOptions={[25, 50, 100]}
                sx={{
                  borderTop: `1px solid ${appleDesign.colors.border}`,
                  px: 2,
                }}
              />
            </>
          ) : null}
        </ErgDataTableShell>
      </ErgPageSurface>
    </ErgContentBand>
  );
}

function SecurityFeedRow({ event }: { event: SecurityFeedItem }) {
  const warning =
    event.severity === "HIGH" ||
    event.severity === "CRITICAL" ||
    Boolean(event.riskCode) ||
    event.result === "WARNING";
  const mobile = event.platform === "WEB_MOBILE";
  const failed = event.result === "FAILED";

  return (
    <TableRow
      hover
      sx={{
        bgcolor: warning ? "rgba(255, 149, 0, 0.03)" : undefined,
        transition: "background-color 0.15s ease",
        "& td": {
          borderColor: appleDesign.colors.border,
          py: 1.6,
        },
      }}
    >
      <TableCell sx={{ whiteSpace: "nowrap" }}>
        <Typography variant="body2" sx={{ color: appleDesign.colors.textPrimary, fontWeight: 700 }}>
          {new Date(event.occurredAt).toLocaleString("vi-VN")}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: appleDesign.colors.textSecondary,
            display: "block",
            fontSize: "0.725rem",
          }}
        >
          {event.sourceType}
        </Typography>
      </TableCell>

      <TableCell>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1.25 }}>
          <AppleAvatar name={event.userName || event.userId} size={32} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: appleDesign.colors.textPrimary, fontWeight: 750 }}>
              {event.userName || "Không xác định"}
            </Typography>
            <Typography variant="caption" sx={{ color: appleDesign.colors.textSecondary, display: "block" }}>
              {event.userEmail || event.userId || "—"}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
          {warning ? <WarningAmberRoundedIcon sx={{ color: appleDesign.colors.amber, fontSize: 16 }} /> : null}
          <Typography
            variant="body2"
            sx={{
              color: warning ? appleDesign.colors.amberText : appleDesign.colors.textPrimary,
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700,
            }}
          >
            {event.riskCode || event.eventType}
          </Typography>
        </Box>
        {event.reason ? (
          <Typography variant="caption" sx={{ color: appleDesign.colors.textSecondary, display: "block", mt: 0.25 }}>
            {event.reason}
          </Typography>
        ) : null}
      </TableCell>

      <TableCell>
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
          {mobile ? (
            <PhoneIphoneRoundedIcon sx={{ color: appleDesign.colors.textTertiary, fontSize: 16 }} />
          ) : (
            <ComputerRoundedIcon sx={{ color: appleDesign.colors.textTertiary, fontSize: 16 }} />
          )}
          <Typography variant="body2" sx={{ color: appleDesign.colors.textPrimary, fontWeight: 550 }}>
            {event.platform || "UNKNOWN_PLATFORM"}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: appleDesign.colors.textSecondary, display: "block", mt: 0.25 }}>
          {event.ipAddress || "Không có IP"}
        </Typography>
      </TableCell>

      <TableCell>
        <AppleStatusBadge
          label={event.result || event.severity}
          tone={failed ? "danger" : warning ? "warning" : event.result === "SUCCESS" ? "success" : "info"}
        />
      </TableCell>
    </TableRow>
  );
}
