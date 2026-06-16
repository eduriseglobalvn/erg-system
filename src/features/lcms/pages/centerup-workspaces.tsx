"use client";

import { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

import DataTable, { type Column } from "@/components/shared/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import type { MenuItem as CenterupMenuItem } from "@/components/portal/CenterUpLayout";
import LcmsGoogleCalendarWorkspace from "@/features/lcms/components/lcms-google-calendar-workspace";
import { getMenuItemDescription } from "@/features/lcms/lcms-menu";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

type TableRow = {
  id: string;
  code: string;
  title: string;
  secondary?: string;
  status: string;
  statusTone: BadgeVariant;
  owner?: string;
  amount?: string;
  date?: string;
  progress?: string;
  extra?: string;
};

type WorkspaceKind =
  | "courses"
  | "classes"
  | "sessions"
  | "assignments"
  | "students"
  | "customers"
  | "tasks"
  | "finance"
  | "report"
  | "settings"
  | "people"
  | "products"
  | "generic";

const money = ["4.500.000 đ", "120.000 đ", "200.000 đ", "1.000.000 đ", "50.000 đ", "0 đ", "225.000 đ"];
const people = ["Phan Ngọc Ánh", "Nguyễn Thanh Tùng", "Nhung Nguyễn", "Quỳnh Đinh", "Ngọc Huyền", "Tina"];

const workspaceMeta: Record<WorkspaceKind, {
  action: string;
  search: string;
  filters: string[];
  tabs: Array<{ label: string; count: number; tone?: BadgeVariant }>;
}> = {
  courses: {
    action: "Khóa học",
    search: "Tìm kiếm theo tên, mã khóa học",
    filters: [],
    tabs: [
      { label: "Tất cả", count: 27 },
      { label: "Đang hoạt động", count: 26, tone: "success" },
      { label: "Dừng hoạt động", count: 1, tone: "neutral" },
    ],
  },
  classes: {
    action: "Lớp học",
    search: "Tìm kiếm theo tên, mã lớp học",
    filters: ["Thứ", "Ca học"],
    tabs: [
      { label: "Tất cả", count: 70 },
      { label: "Đang diễn ra", count: 15, tone: "success" },
      { label: "Đã kết thúc", count: 55, tone: "danger" },
      { label: "Chưa diễn ra", count: 0, tone: "warning" },
      { label: "Chưa cập nhật", count: 0, tone: "neutral" },
    ],
  },
  sessions: {
    action: "Buổi học",
    search: "Tìm kiếm buổi học, lớp, giáo viên",
    filters: ["Trạng thái", "Giáo viên", "Phòng học"],
    tabs: [
      { label: "Tất cả", count: 118 },
      { label: "Sắp diễn ra", count: 32, tone: "info" },
      { label: "Đã kết thúc", count: 80, tone: "success" },
      { label: "Có cảnh báo", count: 6, tone: "warning" },
    ],
  },
  assignments: {
    action: "Bài tập",
    search: "Tìm kiếm theo tiêu đề bài tập",
    filters: ["Nhóm bài tập", "Lớp", "Hạn nộp"],
    tabs: [
      { label: "Tất cả", count: 307 },
      { label: "Chưa bắt đầu", count: 11, tone: "neutral" },
      { label: "Đang làm", count: 51, tone: "info" },
      { label: "Hoàn thành", count: 245, tone: "success" },
    ],
  },
  students: {
    action: "Học viên",
    search: "Tìm kiếm học viên, số điện thoại",
    filters: ["Trạng thái", "Khóa học", "Nguồn"],
    tabs: [
      { label: "Tất cả", count: 842 },
      { label: "Đang học", count: 611, tone: "success" },
      { label: "Tiềm năng", count: 94, tone: "info" },
      { label: "Tạm dừng", count: 137, tone: "warning" },
    ],
  },
  customers: {
    action: "Khách hàng",
    search: "Tìm kiếm khách hàng, phụ huynh",
    filters: ["Trạng thái", "Nguồn", "Nhân viên phụ trách"],
    tabs: [
      { label: "Tất cả", count: 426 },
      { label: "Mới", count: 48, tone: "info" },
      { label: "Đang chăm sóc", count: 120, tone: "warning" },
      { label: "Đã chuyển đổi", count: 258, tone: "success" },
    ],
  },
  tasks: {
    action: "Công việc",
    search: "Tìm kiếm công việc",
    filters: ["Trạng thái", "Người phụ trách", "Thời hạn"],
    tabs: [
      { label: "Tất cả", count: 64 },
      { label: "Đến hạn", count: 0, tone: "info" },
      { label: "Quá hạn", count: 5, tone: "danger" },
      { label: "Chưa bắt đầu", count: 12, tone: "neutral" },
    ],
  },
  finance: {
    action: "Hóa đơn",
    search: "Tìm kiếm theo mã hóa đơn",
    filters: ["Trạng thái", "Nợ", "Thời hạn", "Người phụ trách"],
    tabs: [
      { label: "Tất cả", count: 148 },
      { label: "Hoàn thành", count: 122, tone: "success" },
      { label: "Chờ thanh toán", count: 18, tone: "warning" },
      { label: "Quá hạn", count: 8, tone: "danger" },
    ],
  },
  report: {
    action: "Xuất báo cáo",
    search: "Tìm chỉ số, báo cáo",
    filters: ["Khoảng thời gian", "Đơn vị", "Nhóm dữ liệu"],
    tabs: [
      { label: "Tổng quan", count: 12 },
      { label: "Tăng trưởng", count: 5, tone: "success" },
      { label: "Cần chú ý", count: 3, tone: "warning" },
    ],
  },
  settings: {
    action: "Thiết lập",
    search: "Tìm vai trò, quyền, cấu hình",
    filters: ["Nhóm quyền", "Trạng thái"],
    tabs: [
      { label: "Tất cả", count: 24 },
      { label: "Đang bật", count: 21, tone: "success" },
      { label: "Cần rà soát", count: 3, tone: "warning" },
    ],
  },
  people: {
    action: "Nhân sự",
    search: "Tìm nhân sự, email, số điện thoại",
    filters: ["Vai trò", "Trạng thái", "Cơ sở"],
    tabs: [
      { label: "Tất cả", count: 88 },
      { label: "Đang làm việc", count: 72, tone: "success" },
      { label: "Nghỉ phép", count: 4, tone: "warning" },
      { label: "Ngừng hoạt động", count: 12, tone: "neutral" },
    ],
  },
  products: {
    action: "Hàng hóa",
    search: "Tìm sản phẩm, đối tác",
    filters: ["Nhóm hàng", "Tồn kho", "Đối tác"],
    tabs: [
      { label: "Tất cả", count: 39 },
      { label: "Còn hàng", count: 34, tone: "success" },
      { label: "Sắp hết", count: 5, tone: "warning" },
    ],
  },
  generic: {
    action: "Tạo mới",
    search: "Tìm kiếm dữ liệu",
    filters: ["Trạng thái", "Phạm vi"],
    tabs: [
      { label: "Tất cả", count: 32 },
      { label: "Đang hoạt động", count: 26, tone: "success" },
      { label: "Chờ xử lý", count: 6, tone: "warning" },
    ],
  },
};

export function LcmsCenterupWorkspace({ activeItem, pathname }: { activeItem: CenterupMenuItem | null; pathname: string }) {
  const kind = resolveKind(pathname);

  if (kind === "calendar") {
    return <LcmsGoogleCalendarWorkspace activeItem={activeItem} />;
  }

  if (kind === "report") {
    return <LcmsReportWorkspace activeItem={activeItem} />;
  }

  if (kind === "settings") {
    return <LcmsSettingsWorkspace activeItem={activeItem} pathname={pathname} />;
  }

  return <LcmsListWorkspace activeItem={activeItem} kind={kind} pathname={pathname} />;
}

function LcmsListWorkspace({
  activeItem,
  kind,
  pathname,
}: {
  activeItem: CenterupMenuItem | null;
  kind: WorkspaceKind;
  pathname: string;
}) {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const meta = workspaceMeta[kind];
  const rows = useMemo(() => buildRows(kind, activeItem?.label ?? meta.action), [activeItem?.label, kind, meta.action]);
  const columns = useMemo(() => buildColumns(kind), [kind]);
  const selectable = kind === "finance";

  return (
    <Box>
      <PageHeader
        title={getTitle(activeItem, kind)}
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: getTitle(activeItem, kind) }]}
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} sx={{ minWidth: 116 }}>
            {meta.action}
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <ToolbarFilters meta={meta} compactSearch={kind === "finance"} />
          <CenterupTabs meta={meta} value={tab} onChange={setTab} />
          <DataTable
            columns={columns}
            data={rows}
            getId={(row) => row.id}
            page={page}
            pageSize={10}
            totalCount={rows.length}
            onPageChange={setPage}
            selectable={selectable}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            stickyHeader
            maxHeight={kind === "finance" ? "calc(100vh - 302px)" : undefined}
          />
        </CardContent>
      </Card>

      <ContextFunctionStrip kind={kind} pathname={pathname} />
    </Box>
  );
}

function ToolbarFilters({ meta, compactSearch = false }: { meta: (typeof workspaceMeta)[WorkspaceKind]; compactSearch?: boolean }) {
  return (
    <Box
      sx={{
        alignItems: "center",
        display: "grid",
        gap: 1,
        gridTemplateColumns: {
          xs: "1fr",
          md: meta.filters.length
            ? `${meta.filters.map(() => "minmax(160px, 200px)").join(" ")} minmax(280px, 1fr) auto auto`
            : "minmax(280px, 1fr) auto auto",
        },
        p: 1.5,
      }}
    >
      {meta.filters.map((filter) => (
        <FormControl key={filter} size="small">
          <Select displayEmpty defaultValue="" sx={{ bgcolor: "#FFFFFF" }}>
            <MenuItem value="">{filter}</MenuItem>
            <MenuItem value="active">Đang hoạt động</MenuItem>
            <MenuItem value="pending">Chờ xử lý</MenuItem>
            <MenuItem value="done">Hoàn thành</MenuItem>
          </Select>
        </FormControl>
      ))}
      <TextField
        size="small"
        placeholder={meta.search}
        sx={{ minWidth: compactSearch ? 220 : 320 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: "#637381", fontSize: 22 }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Tooltip title="Bộ lọc nâng cao">
        <IconButton sx={iconButtonSx}>
          <TuneRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Tùy chọn bảng">
        <IconButton sx={iconButtonSx}>
          <MoreVertRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function CenterupTabs({
  meta,
  onChange,
  value,
}: {
  meta: (typeof workspaceMeta)[WorkspaceKind];
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <Box sx={{ borderTop: "1px solid rgba(145,158,171,0.08)", px: 1.5 }}>
      <Tabs
        value={value}
        onChange={(_, next) => onChange(next)}
        sx={{
          minHeight: 56,
          "& .MuiTabs-indicator": { display: "none" },
        }}
      >
        {meta.tabs.map((item, index) => (
          <Tab
            key={item.label}
            label={
              <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <span>{item.label}</span>
                <CountPill count={item.count} tone={item.tone} />
              </Box>
            }
            sx={{
              borderRadius: 1,
              color: "#637381",
              fontWeight: 600,
              minHeight: 40,
              mt: 1,
              px: 2,
              mr: index === meta.tabs.length - 1 ? 0 : 1,
              "&.Mui-selected": {
                bgcolor: "rgba(145,158,171,0.12)",
                color: "#696CFF",
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}

function CountPill({ count, tone = "neutral" }: { count: number; tone?: BadgeVariant }) {
  const colors: Record<BadgeVariant, { bg: string; color: string }> = {
    success: { bg: "rgba(34,197,94,0.16)", color: "#118D57" },
    warning: { bg: "rgba(255,171,0,0.18)", color: "#B76E00" },
    danger: { bg: "rgba(255,86,48,0.16)", color: "#B71D18" },
    info: { bg: "rgba(0,184,217,0.16)", color: "#007A8C" },
    neutral: { bg: "rgba(145,158,171,0.16)", color: "#637381" },
  };
  return (
    <Box
      component="span"
      sx={{
        bgcolor: colors[tone].bg,
        borderRadius: "10px",
        color: colors[tone].color,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: "22px",
        minWidth: 22,
        px: 0.8,
      }}
    >
      {count}
    </Box>
  );
}

function LcmsReportWorkspace({ activeItem }: { activeItem: CenterupMenuItem | null }) {
  const rows = buildRows("report", activeItem?.label ?? "Báo cáo");
  return (
    <Box>
      <PageHeader
        title={activeItem?.label ?? "Báo cáo"}
        subtitle={getMenuItemDescription(activeItem ?? ({ label: "Báo cáo" } as CenterupMenuItem))}
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: activeItem?.label ?? "Báo cáo" }]}
        actions={<Button variant="contained">Xuất báo cáo</Button>}
      />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "repeat(4, 1fr)" }, mb: 2 }}>
        {[
          ["Doanh thu", "212.480.000 đ", "+12.4%", "success"],
          ["Học viên mới", "48", "+8", "info"],
          ["Công việc quá hạn", "5", "-2", "danger"],
          ["Tỉ lệ hoàn thành", "84%", "+6%", "warning"],
        ].map(([label, value, delta, tone]) => (
          <MetricCard key={label} label={label} value={value} delta={delta} tone={tone as BadgeVariant} />
        ))}
      </Box>
      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <ToolbarFilters meta={workspaceMeta.report} />
          <DataTable columns={buildColumns("report")} data={rows} getId={(row) => row.id} totalCount={rows.length} />
        </CardContent>
      </Card>
    </Box>
  );
}

function LcmsSettingsWorkspace({ activeItem, pathname }: { activeItem: CenterupMenuItem | null; pathname: string }) {
  if (pathname.includes("setting-center-role")) {
    return <LcmsRoleSettingsWorkspace />;
  }

  const rows = buildRows("settings", activeItem?.label ?? "Thiết lập");
  return (
    <Box>
      <PageHeader
        title={activeItem?.label ?? "Thiết lập"}
        subtitle="Cấu hình quyền, vai trò, quy trình và tích hợp theo chuẩn vận hành CenterUp."
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: activeItem?.label ?? "Thiết lập" }]}
        actions={<Button variant="contained">Lưu thay đổi</Button>}
      />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "320px minmax(0, 1fr)" } }}>
        <Card>
          <CardContent>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 1 }}>Nhóm cấu hình</Typography>
            {["Quyền truy cập", "Luồng duyệt", "Thông báo", "Dữ liệu đồng bộ", "Bảo mật"].map((item, index) => (
              <Box
                key={item}
                sx={{
                  alignItems: "center",
                  bgcolor: index === 0 ? "rgba(105,108,255,0.08)" : "transparent",
                  borderRadius: 1,
                  color: index === 0 ? "#696CFF" : "#637381",
                  display: "flex",
                  fontSize: 14,
                  fontWeight: index === 0 ? 700 : 500,
                  justifyContent: "space-between",
                  minHeight: 40,
                  px: 1.5,
                }}
              >
                {item}
                <CountPill count={index === 0 ? 12 : 3 + index} tone={index === 0 ? "info" : "neutral"} />
              </Box>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <ToolbarFilters meta={workspaceMeta.settings} compactSearch />
            <DataTable columns={buildColumns("settings")} data={rows} getId={(row) => row.id} totalCount={rows.length} selectable />
          </CardContent>
        </Card>
      </Box>
      <ContextFunctionStrip kind="settings" pathname={pathname} />
    </Box>
  );
}

function LcmsRoleSettingsWorkspace() {
  const [page, setPage] = useState(0);
  const rows = useMemo(() => buildRoleRows(), []);

  return (
    <Box>
      <PageHeader
        title="Quản lý phân quyền"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Quản lý phân quyền" }]}
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} sx={{ minWidth: 136 }}>
            Nhóm quyền
          </Button>
        }
      />
      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: { xs: "1fr", md: "200px minmax(280px, 1fr)" },
              p: 1.5,
            }}
          >
            <FormControl size="small">
              <Select displayEmpty defaultValue="" sx={{ bgcolor: "#FFFFFF" }}>
                <MenuItem value="">Trạng thái</MenuItem>
                <MenuItem value="active">Đang hoạt động</MenuItem>
                <MenuItem value="inactive">Dừng hoạt động</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Tìm kiếm"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ color: "#637381", fontSize: 22 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
          <DataTable
            columns={buildRoleColumns()}
            data={rows}
            footerStart={<CollapseSwitch />}
            getId={(row) => row.id}
            page={page}
            pageSize={10}
            totalCount={13}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

function CollapseSwitch() {
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
      <Switch defaultChecked size="small" />
      <Typography sx={{ color: "#1C252E", fontSize: 14 }}>Thu gọn</Typography>
    </Box>
  );
}

function MetricCard({ delta, label, tone, value }: { delta: string; label: string; tone: BadgeVariant; value: string }) {
  return (
    <Card>
      <CardContent>
        <Typography sx={{ color: "#637381", fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}>{label}</Typography>
        <Typography sx={{ color: "#1C252E", fontSize: 26, fontWeight: 800, mt: 1 }}>{value}</Typography>
        <StatusBadge variant={tone} label={delta} />
      </CardContent>
    </Card>
  );
}

function ContextFunctionStrip({ kind, pathname }: { kind: WorkspaceKind; pathname: string }) {
  const chips = getFunctionChips(kind, pathname);
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
      {chips.map((chip) => (
        <Box key={chip} sx={{ border: "1px solid rgba(145,158,171,0.2)", borderRadius: 1, color: "#637381", fontSize: 12, fontWeight: 700, px: 1.5, py: 0.8 }}>
          {chip}
        </Box>
      ))}
    </Box>
  );
}

function buildRoleColumns(): Column<TableRow>[] {
  return [
    { id: "index", label: "STT", render: (_, index) => index + 1, width: 72, align: "center" },
    {
      id: "title",
      label: "Nhóm quyền",
      render: (row) => (
        <Box sx={{ alignItems: "flex-start", display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography sx={{ color: "#1C252E", fontSize: 14, fontWeight: 500 }}>{row.title}</Typography>
          {row.secondary ? <StatusBadge variant="neutral" label={row.secondary} /> : null}
        </Box>
      ),
      sortable: true,
      width: 260,
    },
    { id: "status", label: "Trạng thái", render: (row) => <StatusBadge variant={row.statusTone} label={row.status} />, sortable: true },
    { id: "date", label: "Ngày tạo", render: (row) => row.date ?? "-", sortable: true },
    { id: "owner", label: "Người tạo", render: (row) => <CreatorCell variant={row.owner ?? "logo"} /> },
    { id: "actions", label: "", render: () => <IconButton size="small"><MoreVertRoundedIcon sx={{ fontSize: 20 }} /></IconButton>, width: 56, align: "center" },
  ];
}

function buildColumns(kind: WorkspaceKind): Column<TableRow>[] {
  const titleColumn: Column<TableRow> = {
    id: "title",
    label: getPrimaryColumn(kind),
    render: (row) => (
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          {kind === "finance" || kind === "people" || kind === "students" || kind === "customers" ? (
            <Avatar sx={{ bgcolor: "#C4CDD5", height: 40, width: 40 }}>{row.title.charAt(0)}</Avatar>
          ) : null}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: "#1C252E", fontSize: 14, fontWeight: 500 }}>{row.title}</Typography>
            <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
              <Typography sx={{ color: "#637381", fontSize: 12 }}>{row.code}</Typography>
              <ContentCopyRoundedIcon sx={{ color: "#919EAB", fontSize: 15 }} />
            </Box>
          </Box>
        </Box>
      </Box>
    ),
    sortable: true,
    width: kind === "finance" ? 270 : 240,
  };

  const common: Column<TableRow>[] = [
    { id: "index", label: "STT", render: (_, index) => index + 1, width: 64, align: "center" },
    titleColumn,
    { id: "owner", label: getOwnerColumn(kind), render: (row) => row.owner ?? "-", sortable: true },
    { id: "status", label: "Trạng thái", render: (row) => <StatusBadge variant={row.statusTone} label={row.status} />, sortable: true },
    { id: "date", label: getDateColumn(kind), render: (row) => row.date ?? "-", sortable: true },
    { id: "amount", label: getAmountColumn(kind), render: (row) => row.amount ?? "-", align: "right", sortable: true },
    { id: "progress", label: "Tiến độ", render: (row) => <ProgressCell value={row.progress ?? "7/10"} /> },
    { id: "extra", label: "Ghi chú", render: (row) => row.extra ?? "-" },
    { id: "actions", label: "", render: () => <IconButton size="small"><MoreVertRoundedIcon sx={{ fontSize: 20 }} /></IconButton>, width: 56, align: "center" },
  ];

  if (kind === "finance") {
    return common.filter((column) => ["index", "date", "amount", "title", "status", "owner", "extra", "actions"].includes(column.id));
  }

  if (kind === "settings") {
    return [
      titleColumn,
      { id: "owner", label: "Nhóm quyền", render: (row) => row.owner ?? "-" },
      { id: "status", label: "Trạng thái", render: (row) => <StatusBadge variant={row.statusTone} label={row.status} /> },
      { id: "extra", label: "Phạm vi áp dụng", render: (row) => row.extra ?? "-" },
      { id: "actions", label: "", render: () => <IconButton size="small"><MoreVertRoundedIcon sx={{ fontSize: 20 }} /></IconButton>, width: 56 },
    ];
  }

  if (kind === "report") {
    return [
      titleColumn,
      { id: "amount", label: "Giá trị", render: (row) => row.amount ?? "-", align: "right" },
      { id: "progress", label: "So với kỳ trước", render: (row) => <ProgressCell value={row.progress ?? "8/10"} /> },
      { id: "status", label: "Nhận định", render: (row) => <StatusBadge variant={row.statusTone} label={row.status} /> },
      { id: "actions", label: "", render: () => <IconButton size="small"><MoreVertRoundedIcon sx={{ fontSize: 20 }} /></IconButton>, width: 56 },
    ];
  }

  return common;
}

function CreatorCell({ variant }: { variant: string }) {
  if (variant === "avatar") {
    return (
      <Avatar
        src="https://api.dicebear.com/8.x/adventurer-neutral/svg?seed=CenterUp"
        sx={{ height: 32, width: 32 }}
      />
    );
  }

  return (
    <Box sx={{ height: 28, width: 28 }}>
      <svg width="28" height="28" viewBox="0 0 93 79" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M74.4675 0.863037C65.6165 0.863037 51.3127 12.7529 51.3127 21.7259C51.3127 24.1612 53.2644 25.9075 57.1186 25.9075C60.9021 25.9075 70.0463 23.9515 70.0463 33.9089C70.0463 37.3565 68.101 40.5108 65.1799 40.5108C53.9492 40.5108 32.072 0.863037 17.7939 0.863037C9.2061 0.863037 0.795898 19.4917 0.795898 39.5564C0.795898 63.1392 7.82152 78.2497 18.5857 78.2497C27.4368 78.2497 41.7405 66.3599 41.7405 57.3868C41.7405 54.9515 39.7888 53.2053 35.9347 53.2053C32.1512 53.2053 23.007 55.1613 23.007 45.2038C23.007 41.7563 24.9522 38.6019 27.8733 38.6019C39.104 38.6019 60.9813 78.2497 75.2593 78.2497C83.8472 78.2497 92.2552 59.621 92.2552 39.5564C92.2574 15.9757 85.2317 0.863037 74.4675 0.863037Z"
          fill="url(#role-creator-logo)"
        />
        <defs>
          <linearGradient id="role-creator-logo" x1="0.800178" y1="39.5573" x2="92.2574" y2="39.5573" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF7F4A" />
            <stop offset="0.3045" stopColor="#FE3EA1" />
            <stop offset="0.6173" stopColor="#883FFF" />
            <stop offset="1" stopColor="#4ECAFE" />
          </linearGradient>
        </defs>
      </svg>
    </Box>
  );
}

function ProgressCell({ value }: { value: string }) {
  const [done, total] = value.split("/").map((part) => Number(part) || 0);
  const percent = total ? Math.min(100, (done / total) * 100) : 0;
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1, minWidth: 86 }}>
      <Typography sx={{ fontSize: 13 }}>{value}</Typography>
      <LinearProgress variant="determinate" value={percent} sx={{ flex: 1, minWidth: 34 }} />
    </Box>
  );
}

function buildRows(kind: WorkspaceKind, label: string): TableRow[] {
  const titles: Record<WorkspaceKind, string[]> = {
    courses: ["piano 30b cơ bản", "Bee 2", "Bebop 1 - M1", "Tiếng Đức", "TESOL", "Nội bộ", "CAM (24 buổi)", "Piano", "TOFLE", "IELTS 7.0"],
    classes: ["P1", "C1", "Bee 2.2", "BE2", "Python cơ bản", "Nguyễn Văn A", "TESOL A", "Cầu lông", "IELTS 7.0", "CAM 3"],
    sessions: ["Buổi 21", "Buổi 31", "Buổi 6", "Buổi 77", "Buổi 22", "Buổi 16", "Buổi 125", "Buổi 7", "Buổi 78", "Buổi 118"],
    assignments: ["SPEAKING TEST", "Reading sprint", "Bài tập Lesson 1", "Review test 1", "Bảng tính SUM", "Listening drill", "Grammar practice", "Final mock", "Speaking prompt", "Vocabulary set"],
    students: ["Phan Ngọc Ánh", "Hòa", "Nguyễn Văn A", "Lê Long Hoàng", "Tường Anh", "Bảo Ngọc", "Mai Linh", "Quang Huy", "Minh Anh", "Gia Bảo"],
    customers: ["Ngọc Anh", "Anh Tuấn", "Thanh Mai", "Minh Châu", "Gia Hân", "Bích Ngọc", "Văn Cường", "Phương Linh", "Hà My", "Hoàng Nam"],
    tasks: ["Chưa cập nhật", "Gọi điện", "Soạn giáo trình", "Tổ chức chương trình", "Nhắc lịch học", "Duyệt học liệu", "Cập nhật học phí", "Chốt lớp mới", "Kiểm tra feedback", "Gửi báo cáo"],
    finance: ["AN", "Ngọc Anh", "Nguyễn Văn C", "Aa", "Tường Anh 1", "Phan Ngọc Ánh", "Bảo Ngọc", "Quỳnh Đinh", "Tina", "Nhung Nguyễn"],
    report: ["Doanh thu học phí", "Tuyển sinh mới", "Tỉ lệ chuyển đổi", "Công việc quá hạn", "Dòng tiền", "Lãi lỗ", "Hiệu suất lớp", "Học viên nghỉ", "Tồn kho", "Tích hợp"],
    settings: ["Quản trị viên trung tâm", "Giáo viên", "Tư vấn tuyển sinh", "Kế toán", "Quản lý học liệu", "Duyệt xuất bản", "Import dữ liệu", "Thiết lập lịch", "API key", "Zalo OA"],
    people: ["Phan Ngọc Ánh", "Nhung Nguyễn", "Nguyễn Trần Vĩnh An", "Tina", "Quỳnh Đinh", "Ngọc Huyền", "Thanh Tùng", "Minh Đức", "Hải Anh", "Bảo Trâm"],
    products: ["Sách IELTS", "Bộ flashcard", "Áo đồng phục", "Đối tác in ấn", "Tai nghe phòng lab", "Workbook", "Voucher khóa học", "Bút cảm ứng", "License MOS", "Tài liệu STEM"],
    generic: [label, "Nhóm dữ liệu A", "Nhóm dữ liệu B", "Cấu hình mẫu", "Dữ liệu nhập", "Bản ghi mới", "Bản ghi đang duyệt", "Bản ghi đã khóa", "Bản ghi nháp", "Bản ghi lưu trữ"],
  };

  return Array.from({ length: 10 }, (_, index) => ({
    id: `${kind}-${index + 1}`,
    code: `***${["E7CD", "9D2D", "396F", "F03E", "05F7", "A4D7", "D056", "DC85", "83FD", "2C92"][index]}`,
    title: titles[kind][index],
    secondary: `${label} ${index + 1}`,
    status: index % 6 === 0 ? "Chờ thanh toán" : index % 5 === 0 ? "Đã kết thúc" : index % 4 === 0 ? "Chưa cập nhật" : "Hoàn thành",
    statusTone: index % 6 === 0 ? "warning" : index % 5 === 0 ? "danger" : index % 4 === 0 ? "neutral" : "success",
    owner: people[index % people.length],
    amount: kind === "finance" || kind === "report" || kind === "courses" ? money[index % money.length] : `${index + 1}/${10 + index}`,
    date: `${String(10 - (index % 5)).padStart(2, "0")}/06/2026`,
    progress: `${(index % 9) + 1}/${index + 10}`,
    extra: kind === "classes" ? "Thứ Hai, 19:00 - 20:30" : kind === "finance" ? ["CAM (24", "Bee 2", "IELTS", "-"][index % 4] : "Theo dõi tự động",
  }));
}

function buildRoleRows(): TableRow[] {
  return [
    ["Chăm sóc khách hàng", undefined, "Đang hoạt động", "success", "03/02/2025", "logo"],
    ["Chủ trung tâm", undefined, "Đang hoạt động", "success", "03/02/2025", "logo"],
    ["csa", undefined, "Dừng hoạt động", "neutral", "04/11/2025", "logo"],
    ["Giáo viên", "Giáo viên", "Đang hoạt động", "success", "03/02/2025", "logo"],
    ["Giáo vụ", undefined, "Đang hoạt động", "success", "03/02/2025", "logo"],
    ["Hành chính nhân sự", undefined, "Đang hoạt động", "success", "03/02/2025", "logo"],
    ["hh", undefined, "Dừng hoạt động", "neutral", "26/10/2025", "avatar"],
    ["Kế toán", undefined, "Đang hoạt động", "success", "03/02/2025", "logo"],
    ["Marketing", undefined, "Đang hoạt động", "success", "03/02/2025", "logo"],
    ["Quản lý", undefined, "Dừng hoạt động", "neutral", "03/02/2025", "avatar"],
  ].map(([title, secondary, status, statusTone, date, owner], index) => ({
    id: `role-${index + 1}`,
    code: "",
    title: title as string,
    secondary: secondary as string | undefined,
    status: status as string,
    statusTone: statusTone as BadgeVariant,
    date: date as string,
    owner: owner as string,
  }));
}

function resolveKind(pathname: string): WorkspaceKind | "calendar" {
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/courses")) return "courses";
  if (pathname.startsWith("/classes")) return "classes";
  if (pathname.startsWith("/sessions")) return "sessions";
  if (pathname.startsWith("/assignments") || pathname.includes("assignment")) return "assignments";
  if (pathname.startsWith("/students")) return "students";
  if (pathname.startsWith("/customers")) return "customers";
  if (pathname.startsWith("/center-tasks")) return "tasks";
  if (pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/report")) return "report";
  if (pathname.startsWith("/setting") || pathname.startsWith("/integration")) return "settings";
  if (pathname.startsWith("/employees")) return "people";
  if (pathname.startsWith("/other")) return "products";
  return "generic";
}

function getTitle(activeItem: CenterupMenuItem | null, kind: WorkspaceKind) {
  if (activeItem?.label) {
    if (kind === "courses") return "Danh sách khóa học";
    if (kind === "classes") return "Danh sách lớp học";
    if (kind === "sessions") return "Danh sách buổi học";
    if (kind === "assignments") return "Danh sách bài tập";
    if (kind === "finance") return activeItem.label.includes("Hóa") ? "Danh sách hóa đơn" : activeItem.label;
    return activeItem.label;
  }
  return workspaceMeta[kind].action;
}

function getPrimaryColumn(kind: WorkspaceKind) {
  if (kind === "courses") return "Khóa học";
  if (kind === "classes") return "Tên lớp học";
  if (kind === "sessions") return "Buổi học";
  if (kind === "assignments") return "Tiêu đề bài tập";
  if (kind === "finance") return "Tài khoản học viên";
  if (kind === "settings") return "Vai trò / cấu hình";
  if (kind === "students") return "Học viên";
  if (kind === "customers") return "Khách hàng";
  return "Tên";
}

function getOwnerColumn(kind: WorkspaceKind) {
  if (kind === "finance") return "Nhân viên sale";
  if (kind === "classes" || kind === "sessions") return "Giáo viên";
  if (kind === "tasks") return "Người phụ trách";
  return "Phụ trách";
}

function getDateColumn(kind: WorkspaceKind) {
  if (kind === "finance") return "Ngày tạo";
  if (kind === "classes") return "Ngày bắt đầu / kết thúc";
  if (kind === "tasks") return "Thời hạn";
  return "Ngày cập nhật";
}

function getAmountColumn(kind: WorkspaceKind) {
  if (kind === "courses") return "Doanh thu ghi nhận";
  if (kind === "finance") return "Mã hóa đơn";
  if (kind === "assignments") return "Đã nộp";
  return "Giá trị";
}

function getFunctionChips(kind: WorkspaceKind, pathname: string): string[] {
  if (kind === "finance") return ["Chọn nhiều hóa đơn", "Ghi nhận thanh toán", "Xuất Excel", "Theo dõi công nợ"];
  if (kind === "classes") return ["Lọc theo thứ/ca học", "Theo dõi tiến độ", "Gán giáo viên", "Mở dashboard lớp"];
  if (kind === "assignments") return ["Giao bài hàng loạt", "Theo dõi nộp bài", "Chấm điểm", "Đồng bộ LMS"];
  if (kind === "settings") return ["Phân quyền", "Audit thay đổi", "Bật/tắt cấu hình", pathname.includes("integration") ? "Kiểm tra kết nối" : "Áp dụng theo vai trò"];
  if (kind === "tasks") return ["Đến hạn", "Quá hạn", "Người phụ trách", "Nhắc việc"];
  return ["Tìm kiếm", "Lọc dữ liệu", "Tùy chọn cột", "Xuất dữ liệu"];
}

const iconButtonSx = {
  border: "1px solid rgba(145,158,171,0.2)",
  borderRadius: 1,
  color: "#637381",
  height: 40,
  width: 40,
};
