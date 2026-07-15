'use client';

/**
 * LCMS Dashboard - ERG enterprise design
 * MUI v9 Table + Responsive Grid
 * 
 * Design tokens:
 * - Primary: #696CFF (PURPLE)
 * - Typography: Manrope / JetBrains Mono
 * - Sidebar: #1C252E (dark), 280px
 * - Card: shadow-card (0 1px 3px), border neutral-200, p-6, radius-md (8px)
 * - Table: Header bg neutral-50, cell padding 12px 16px
 */
import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import TodayIcon from '@mui/icons-material/Today';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// ============================================
// TYPES
// ============================================
type TaskStatus = 'overdue' | 'pending' | 'inactive';
type SessionStatus = 'upcoming' | 'done' | 'cancelled';
type AbsenceStatus = 'pending' | 'approved' | 'rejected';

interface Task {
  id: string;
  name: string;
  code: string;
  status: TaskStatus;
  assignee: string;
  manager: string;
}

interface Absence {
  id: string;
  student: string;
  email: string;
  class: string;
  startDate: string;
  endDate: string;
  status: AbsenceStatus;
}

interface Session {
  id: string;
  name: string;
  class: string;
  teacher: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  status: SessionStatus;
}

interface CalendarDay {
  date: number;
  isToday: boolean;
  hasEvent: boolean;
}

// ============================================
// MOCK DATA
// ============================================
const taskData: Task[] = [
  { id: '1', name: 'Chưa cập nhật', code: '***DFD4', status: 'overdue', assignee: '+4', manager: '+4' },
  { id: '2', name: 'Gọi điện', code: '***08D7', status: 'overdue', assignee: 'Phan Ngọc Ánh', manager: 'Ngọc Huyền' },
  { id: '3', name: 'Soạn giáo trình', code: '***2C92', status: 'pending', assignee: '+1', manager: 'Nhung Nguyễn' },
  { id: '4', name: 'Chưa cập nhật', code: '***83FD', status: 'inactive', assignee: 'Phan Ngọc Ánh', manager: 'Phan Ngọc Ánh' },
  { id: '5', name: 'Duyệt đơn nghỉ', code: '***A1B2', status: 'pending', assignee: 'Ngọc Huyền', manager: 'Ngọc Huyền' },
];

const absenceData: Absence[] = [
  { id: '1', student: 'Phan Ngọc Ánh', email: 'anh.pn@email.com', class: 'IELTS 7.0', startDate: '11/06', endDate: '12/06', status: 'pending' },
  { id: '2', student: 'Nguyễn Văn Minh', email: 'minh.nv@email.com', class: 'IELTS 6.5+', startDate: '10/06', endDate: '15/06', status: 'pending' },
  { id: '3', student: 'Trần Thị Lan', email: 'lan.tt@email.com', class: 'P1', startDate: '12/06', endDate: '13/06', status: 'pending' },
  { id: '4', student: 'Lê Hoàng Nam', email: 'nam.lh@email.com', class: 'TOEIC 600+', startDate: '11/06', endDate: '14/06', status: 'pending' },
  { id: '5', student: 'Đặng Phương Mai', email: 'mai.dp@email.com', class: 'IELTS 7.0', startDate: '13/06', endDate: '13/06', status: 'pending' },
];

const todaySessions: Session[] = [
  { id: '4', name: 'Buổi 3 - Unit 1', class: 'IELTS 7.0', teacher: 'Phan Ngọc Ánh', date: '11/06', startTime: '08:00', endTime: '10:00', room: 'P.301', status: 'done' },
  { id: '5', name: 'Buổi 4 - Unit 1', class: 'IELTS 6.5+', teacher: 'Nguyễn Thị Nhung', date: '11/06', startTime: '10:30', endTime: '12:30', room: 'P.302', status: 'upcoming' },
  { id: '6', name: 'Buổi 2 - Unit 2', class: 'P1', teacher: 'Tina', date: '11/06', startTime: '14:00', endTime: '16:00', room: 'P.201', status: 'upcoming' },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================
const getStatusConfig = (status: TaskStatus | AbsenceStatus | SessionStatus) => {
  const configs = {
    overdue: { bg: 'rgba(255,86,48,0.12)', color: '#B71D18', label: 'Quá hạn' },
    pending: { bg: 'rgba(255,171,0,0.16)', color: '#B76E00', label: 'Chờ duyệt' },
    inactive: { bg: '#F4F6F8', color: '#637381', label: 'Chưa cập nhật' },
    approved: { bg: 'rgba(34,197,94,0.12)', color: '#118D57', label: 'Đã duyệt' },
    rejected: { bg: 'rgba(255,86,48,0.12)', color: '#B71D18', label: 'Từ chối' },
    upcoming: { bg: 'rgba(0,184,217,0.12)', color: '#007A8C', label: 'Sắp diễn ra' },
    done: { bg: 'rgba(34,197,94,0.12)', color: '#118D57', label: 'Đã kết thúc' },
    cancelled: { bg: 'rgba(255,86,48,0.12)', color: '#B71D18', label: 'Đã hủy' },
  };
  return configs[status] || configs.pending;
};

const getAvatarColor = (name: string) => {
  const colors = ['#696CFF', '#00B8D9', '#FF5630', '#FFAB00', '#22C55E'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const getInitials = (name: string) => {
  if (name.startsWith('+')) return name;
  const parts = name.split(' ');
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
};

// ============================================
// COMPONENTS
// ============================================

/** Status Badge Component */
function StatusBadge({ status }: { status: TaskStatus | AbsenceStatus | SessionStatus }) {
  const config = getStatusConfig(status);
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontSize: 12,
        fontWeight: 500,
        height: 24,
        borderRadius: '12px',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}

/** Stat Card Component */
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card
      sx={{
        flex: 1,
        minWidth: { xs: 140, sm: 160 },
        border: '1px solid rgba(145,158,171,0.12)',
        borderRadius: 2,
        boxShadow: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'rgba(105,108,255,0.3)',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: `${color}14`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1C252E', lineHeight: 1.2 }}>
              {value}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#637381' }}>{label}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

/** Calendar Mini Component */
function CalendarMini() {
  const days: CalendarDay[] = [
    { date: 8, isToday: false, hasEvent: false },
    { date: 9, isToday: false, hasEvent: false },
    { date: 10, isToday: false, hasEvent: true },
    { date: 11, isToday: true, hasEvent: true },
    { date: 12, isToday: false, hasEvent: false },
    { date: 13, isToday: false, hasEvent: true },
    { date: 14, isToday: false, hasEvent: false },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1C252E' }}>
          Tháng 6, 2026
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" sx={{ color: '#637381' }}>
            <NavigateBeforeIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" sx={{ color: '#637381' }}>
            <NavigateNextIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 2 }}>
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
          <Typography
            key={d}
            sx={{
              fontSize: 11,
              color: '#919EAB',
              textAlign: 'center',
              fontWeight: 500,
              py: 0.5,
            }}
          >
            {d}
          </Typography>
        ))}
        {days.map((day, i) => (
          <Tooltip key={i} title={day.hasEvent ? 'Có sự kiện' : ''} arrow>
            <Box
              sx={{
                textAlign: 'center',
                py: 0.75,
                borderRadius: '50%',
                bgcolor: day.isToday ? '#696CFF' : day.hasEvent ? 'rgba(105,108,255,0.08)' : 'transparent',
                color: day.isToday ? '#FFFFFF' : '#1C252E',
                fontSize: 12,
                fontWeight: day.isToday ? 600 : 400,
                cursor: 'pointer',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: day.isToday ? '#696CFF' : 'rgba(145,158,171,0.08)',
                },
              }}
            >
              {day.date}
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
}

/** Dashboard Table Component */
interface DashboardTableProps<T> {
  columns: { id: string; label: string; sortable?: boolean }[];
  data: T[];
  renderRow: (row: T) => React.ReactNode;
  maxHeight?: number | string;
}

function DashboardTable<T>({ columns, data, renderRow, maxHeight }: DashboardTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const paginatedData = useMemo(() => {
    return data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [data, page, rowsPerPage]);

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {paginatedData.map((item, idx) => (
          <Box
            key={idx}
            sx={{
              p: 2,
              bgcolor: '#FAFAFA',
              borderRadius: 1.5,
              border: '1px solid rgba(145,158,171,0.08)',
            }}
          >
            {renderRow(item)}
          </Box>
        ))}
        {data.length > rowsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
            <Button
              size="small"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              sx={{ minWidth: 32, color: '#637381' }}
            >
              <NavigateBeforeIcon />
            </Button>
            <Typography sx={{ fontSize: 14, color: '#637381', alignSelf: 'center' }}>
              {page + 1}/{Math.ceil(data.length / rowsPerPage)}
            </Typography>
            <Button
              size="small"
              onClick={() => setPage(p => Math.min(Math.ceil(data.length / rowsPerPage) - 1, p + 1))}
              disabled={page >= Math.ceil(data.length / rowsPerPage) - 1}
              sx={{ minWidth: 32, color: '#637381' }}
            >
              <NavigateNextIcon />
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ maxHeight }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell
                key={col.id}
                sx={{
                  fontWeight: 600,
                  color: '#637381',
                  fontSize: 13,
                  py: 1.5,
                  px: 2,
                  borderBottom: '1px dashed rgba(145,158,171,0.2)',
                  bgcolor: '#FAFAFA',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.sortable ? (
                  <TableSortLabel sx={{ color: '#637381 !important', '&.Mui-active': { color: '#696CFF' } }}>
                    {col.label}
                  </TableSortLabel>
                ) : col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.map((item, idx) => (
            <TableRow
              key={idx}
              hover
              sx={{
                '&:hover': { bgcolor: 'rgba(105,108,255,0.02)' },
                cursor: 'pointer',
              }}
            >
              {renderRow(item)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.length > rowsPerPage && (
        <TablePagination
          component="div"
          count={data.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10]}
          labelRowsPerPage="Dòng/trang"
          sx={{
            fontSize: 13,
            color: '#637381',
            borderTop: '1px solid rgba(145,158,171,0.08)',
            '& .MuiTablePagination-toolbar': { minHeight: 48 },
          }}
        />
      )}
    </TableContainer>
  );
}

/** Session Card for Today */
function SessionCard({ session }: { session: Session }) {
  const statusIcon = {
    upcoming: <EventNoteIcon sx={{ fontSize: 16, color: '#007A8C' }} />,
    done: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16, color: '#118D57' }} />,
    cancelled: <CancelOutlinedIcon sx={{ fontSize: 16, color: '#B71D18' }} />,
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: '#FAFAFA',
        border: '1px solid rgba(145,158,171,0.08)',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: 'rgba(105,108,255,0.2)',
          bgcolor: 'rgba(105,108,255,0.02)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1C252E' }}>
          {session.startTime}
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#919EAB' }}>-</Typography>
        <Typography sx={{ fontSize: 13, color: '#637381' }}>
          {session.endTime}
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#1C252E', mb: 0.25 }}>
          {session.name}
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#637381' }}>
          {session.class} • {session.room}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {statusIcon[session.status]}
        <Typography sx={{ fontSize: 11, color: '#637381' }}>
          {getStatusConfig(session.status).label}
        </Typography>
      </Box>
    </Box>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
export default function LcmsDashboard() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter tasks by search
  const filteredTasks = useMemo(() => {
    if (!searchTerm) return taskData;
    return taskData.filter(
      t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           t.assignee.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Task columns
  const taskColumns = [
    { id: 'name', label: 'Tên công việc', sortable: true },
    { id: 'status', label: 'Trạng thái', sortable: true },
    { id: 'assignee', label: 'Người phụ trách' },
    { id: 'manager', label: 'Người quản lý' },
  ];

  // Absence columns
  const absenceColumns = [
    { id: 'student', label: 'Học viên' },
    { id: 'class', label: 'Lớp học' },
    { id: 'dates', label: 'Thời gian nghỉ' },
    { id: 'status', label: 'Trạng thái' },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: 20, sm: 24 },
                fontWeight: 700,
                color: '#1C252E',
              }}
            >
              Trang chủ
            </Typography>
            <Typography sx={{ fontSize: 14, color: '#637381', mt: 0.5 }}>
              Chào buổi sáng! Hôm nay là thứ năm, 11/06/2026
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            sx={{
              bgcolor: '#696CFF',
              color: '#FFF',
              textTransform: 'none',
              fontSize: 14,
              fontWeight: 600,
              minHeight: 40,
              px: 2.5,
              borderRadius: 1.5,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#585CE0', boxShadow: 'none' },
            }}
          >
            Tạo mới
          </Button>
        </Box>
      </Box>

      {/* Stats Row */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <StatCard
          icon={<SchoolOutlinedIcon sx={{ fontSize: 20 }} />}
          label="Khóa học"
          value={12}
          color="#696CFF"
        />
        <StatCard
          icon={<GroupsRoundedIcon sx={{ fontSize: 20 }} />}
          label="Học viên"
          value={287}
          color="#00B8D9"
        />
        <StatCard
          icon={<AssignmentOutlinedIcon sx={{ fontSize: 20 }} />}
          label="Bài tập"
          value={45}
          color="#FFAB00"
        />
        <StatCard
          icon={<CalendarMonthIcon sx={{ fontSize: 20 }} />}
          label="Lớp học"
          value={18}
          color="#22C55E"
        />
      </Box>

      {/* Main Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 380px' },
          gap: 3,
        }}
      >
        {/* Column 1: Tasks */}
        <Card
          sx={{
            border: '1px solid rgba(145,158,171,0.12)',
            borderRadius: 2,
            boxShadow: 'none',
            gridColumn: { lg: 'span 2' },
          }}
        >
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1C252E' }}>
                  Công việc
                </Typography>
                <Chip
                  label={taskData.length}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(145,158,171,0.16)',
                    fontSize: 12,
                    fontWeight: 500,
                    height: 22,
                    borderRadius: '10px',
                  }}
                />
              </Box>
            }
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: '#919EAB' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    width: { xs: 150, sm: 200 },
                    '& .MuiOutlinedInput-root': {
                      height: 36,
                      borderRadius: 1.5,
                      fontSize: 13,
                      bgcolor: '#FAFAFA',
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: 'rgba(145,158,171,0.2)' },
                      '&.Mui-focused fieldset': { borderColor: '#696CFF' },
                    },
                  }}
                />
                <Button
                  size="small"
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#696CFF',
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'rgba(105,108,255,0.08)' },
                  }}
                >
                  Xem tất cả
                </Button>
              </Box>
            }
            sx={{ px: 2.5, pt: 2, pb: 1, '& .MuiCardHeader-action': { alignSelf: 'center', my: 0 } }}
          />
          <Divider sx={{ mx: 2.5, borderColor: 'rgba(145,158,171,0.08)' }} />
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <DashboardTable
              columns={taskColumns}
              data={filteredTasks}
              maxHeight={320}
              renderRow={(row: Task) => (
                <>
                  <TableCell sx={{ py: 1.5, px: 2, borderBottom: '1px dashed rgba(145,158,171,0.1)' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#1C252E' }}>
                      {row.name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: '#919EAB' }}>
                      {row.code}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, px: 2, borderBottom: '1px dashed rgba(145,158,171,0.1)' }}>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell sx={{ py: 1.5, px: 2, borderBottom: '1px dashed rgba(145,158,171,0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {row.assignee.startsWith('+') ? (
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: '#F4F6F8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#637381',
                          }}
                        >
                          {row.assignee}
                        </Box>
                      ) : (
                        <>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: getAvatarColor(row.assignee),
                            }}
                          >
                            {getInitials(row.assignee)}
                          </Avatar>
                          <Typography sx={{ fontSize: 13, color: '#1C252E' }}>
                            {row.assignee}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, px: 2, borderBottom: '1px dashed rgba(145,158,171,0.1)' }}>
                    <Typography sx={{ fontSize: 13, color: '#637381' }}>
                      {row.manager}
                    </Typography>
                  </TableCell>
                </>
              )}
            />
          </CardContent>
        </Card>

        {/* Right Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Today's Schedule */}
          <Card
            sx={{
              border: '1px solid rgba(145,158,171,0.12)',
              borderRadius: 2,
              boxShadow: 'none',
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TodayIcon sx={{ fontSize: 20, color: '#696CFF' }} />
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1C252E' }}>
                    Lịch dạy hôm nay
                  </Typography>
                </Box>
              }
              action={
                <Chip
                  label="11/06"
                  size="small"
                  sx={{
                    bgcolor: '#696CFF',
                    color: '#FFF',
                    fontSize: 12,
                    fontWeight: 500,
                    height: 24,
                    borderRadius: '10px',
                  }}
                />
              }
              sx={{ px: 2.5, pt: 2, pb: 1, '& .MuiCardHeader-action': { alignSelf: 'center', my: 0 } }}
            />
            <Divider sx={{ mx: 2.5, borderColor: 'rgba(145,158,171,0.08)' }} />
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {todaySessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </CardContent>
          </Card>

          {/* Mini Calendar */}
          <Card
            sx={{
              border: '1px solid rgba(145,158,171,0.12)',
              borderRadius: 2,
              boxShadow: 'none',
            }}
          >
            <CardHeader
              title={
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1C252E' }}>
                  Lịch tháng
                </Typography>
              }
              action={
                <IconButton size="small" sx={{ color: '#637381' }}>
                  <ChevronRightRoundedIcon />
                </IconButton>
              }
              sx={{ px: 2.5, pt: 2, pb: 1, '& .MuiCardHeader-action': { alignSelf: 'center', my: 0 } }}
            />
            <Divider sx={{ mx: 2.5, borderColor: 'rgba(145,158,171,0.08)' }} />
            <CardContent sx={{ p: 2 }}>
              <CalendarMini />
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Absence Section - Full Width on Mobile */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mt: 3,
        }}
      >
        {/* Student Absences */}
        <Card
          sx={{
            border: '1px solid rgba(145,158,171,0.12)',
            borderRadius: 2,
            boxShadow: 'none',
          }}
        >
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PersonRoundedIcon sx={{ fontSize: 20, color: '#FFAB00' }} />
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1C252E' }}>
                  Đơn xin nghỉ học viên
                </Typography>
                <Chip
                  label="45"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,171,0,0.16)',
                    color: '#B76E00',
                    fontSize: 12,
                    fontWeight: 500,
                    height: 22,
                    borderRadius: '10px',
                  }}
                />
              </Box>
            }
            action={
              <Button
                size="small"
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#696CFF',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(105,108,255,0.08)' },
                }}
              >
                Xem tất cả
              </Button>
            }
            sx={{ px: 2.5, pt: 2, pb: 1, '& .MuiCardHeader-action': { alignSelf: 'center', my: 0 } }}
          />
          <Divider sx={{ mx: 2.5, borderColor: 'rgba(145,158,171,0.08)' }} />
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <DashboardTable
              columns={absenceColumns}
              data={absenceData}
              maxHeight={280}
              renderRow={(row: Absence) => (
                <>
                  <TableCell sx={{ py: 1.5, px: 2, borderBottom: '1px dashed rgba(145,158,171,0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: 12,
                          fontWeight: 600,
                          bgcolor: getAvatarColor(row.student),
                        }}
                      >
                        {getInitials(row.student)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#1C252E' }}>
                          {row.student}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#919EAB' }}>
                          {row.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, px: 2, borderBottom: '1px dashed rgba(145,158,171,0.1)' }}>
                    <Typography sx={{ fontSize: 13, color: '#696CFF', fontWeight: 500 }}>
                      {row.class}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, px: 2, borderBottom: '1px dashed rgba(145,158,171,0.1)' }}>
                    <Typography sx={{ fontSize: 12, color: '#637381' }}>
                      {row.startDate} - {row.endDate}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, px: 2, borderBottom: '1px dashed rgba(145,158,171,0.1)' }}>
                    <StatusBadge status={row.status} />
                  </TableCell>
                </>
              )}
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card
          sx={{
            border: '1px solid rgba(145,158,171,0.12)',
            borderRadius: 2,
            boxShadow: 'none',
          }}
        >
          <CardHeader
            title={
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1C252E' }}>
                Thao tác nhanh
              </Typography>
            }
            sx={{ px: 2.5, pt: 2, pb: 1 }}
          />
          <Divider sx={{ mx: 2.5, borderColor: 'rgba(145,158,171,0.08)' }} />
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              {[
                { icon: <AddIcon />, label: 'Tạo lớp học', color: '#696CFF' },
                { icon: <AssignmentOutlinedIcon />, label: 'Giao bài tập', color: '#FFAB00' },
                { icon: <GroupsRoundedIcon />, label: 'Thêm học viên', color: '#00B8D9' },
                { icon: <CalendarMonthIcon />, label: 'Lên lịch', color: '#22C55E' },
                { icon: <EventNoteIcon />, label: 'Điểm danh', color: '#FF5630' },
                { icon: <SchoolOutlinedIcon />, label: 'Báo cáo', color: '#637381' },
              ].map((action, idx) => (
                <Button
                  key={idx}
                  variant="outlined"
                  sx={{
                    flexDirection: 'column',
                    gap: 1,
                    py: 2,
                    px: 1,
                    borderColor: 'rgba(145,158,171,0.16)',
                    borderRadius: 1.5,
                    color: action.color,
                    '&:hover': {
                      borderColor: action.color,
                      bgcolor: `${action.color}08`,
                    },
                  }}
                >
                  <Box sx={{ color: action.color }}>{action.icon}</Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#1C252E' }}>
                    {action.label}
                  </Typography>
                </Button>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
