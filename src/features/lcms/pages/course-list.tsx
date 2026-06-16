'use client';

import { useState } from 'react';
import { Box, Button, TextField, MenuItem, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';

const courseData = [
  { id: '1', name: 'IELTS 7.0', code: 'IELTS7.0', status: 'active', students: 29, createdAt: '01/03/2026' },
  { id: '2', name: 'IELTS 6.5+', code: 'IELT6.5+', status: 'active', students: 24, createdAt: '15/02/2026' },
  { id: '3', name: 'P1', code: 'P1', status: 'active', students: 18, createdAt: '10/01/2026' },
  { id: '4', name: 'TOEIC 600+', code: 'TOEIC600', status: 'inactive', students: 12, createdAt: '05/12/2025' },
  { id: '5', name: 'Tiếng Anh thiếu nhi', code: 'KIDS', status: 'active', students: 35, createdAt: '20/11/2025' },
];

const columns = [
  { id: 'name', label: 'Tên khóa học', render: (row: typeof courseData[0]) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ fontWeight: 500, color: '#1C252E', fontSize: 14 }}>{row.name}</Box>
      <Box sx={{ color: '#919EAB', fontSize: 12 }}>{row.code}</Box>
    </Box>
  ), sortable: true },
  { id: 'status', label: 'Trạng thái', render: (row: typeof courseData[0]) => (
    <StatusBadge variant={row.status === 'active' ? 'success' : 'neutral'} label={row.status === 'active' ? 'Đang hoạt động' : 'Dừng hoạt động'} />
  ), sortable: true },
  { id: 'students', label: 'Học viên', render: (row: typeof courseData[0]) => (
    <Box sx={{ fontSize: 14, color: '#1C252E' }}>{row.students}</Box>
  ), sortable: true },
  { id: 'createdAt', label: 'Ngày tạo', render: (row: typeof courseData[0]) => (
    <Box sx={{ fontSize: 14, color: '#637381' }}>{row.createdAt}</Box>
  ), sortable: true },
];

export default function CourseList() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = courseData.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      <PageHeader
        title="Danh sách khóa học"
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Khóa học' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} sx={{
            bgcolor: '#696CFF', color: '#FFF', textTransform: 'none', fontSize: 14, fontWeight: 600,
            minHeight: 36, px: 2, borderRadius: 1,
            '&:hover': { bgcolor: '#585BE0' },
          }}>
            Tạo khóa học
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          placeholder="Tìm kiếm theo tên, mã khóa học"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#919EAB', fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1, fontSize: 14, bgcolor: '#FFFFFF' },
            minWidth: 320,
          }}
        />
        <TextField select defaultValue="" sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { height: 40, borderRadius: 1, fontSize: 14 } }}>
          <MenuItem value="">Tất cả trạng thái</MenuItem>
          <MenuItem value="active">Đang hoạt động</MenuItem>
          <MenuItem value="inactive">Dừng hoạt động</MenuItem>
        </TextField>
      </Box>

      <DataTable
        columns={columns}
        data={filtered}
        totalCount={courseData.length}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        getId={(row) => row.id}
      />
    </Box>
  );
}
