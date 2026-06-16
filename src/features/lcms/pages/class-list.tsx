'use client';

import { useState } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';

const classData = Array.from({ length: 15 }, (_, i) => ({
  id: String(i + 1),
  name: `Lớp ${['IELTS 7.0', 'IELTS 6.5+', 'P1', 'TOEIC 600+', 'KIDS'][i % 5]}`,
  code: `CL${String(2026001 + i)}`,
  course: ['IELTS 7.0', 'IELTS 6.5+', 'P1', 'TOEIC 600+', 'KIDS'][i % 5],
  teacher: ['Phan Ngọc Ánh', 'Nguyễn Thị Nhung', 'Nguyễn Trần Vĩnh An', 'Tina'][i % 4],
  students: Math.floor(Math.random() * 20) + 10,
  status: i % 7 === 0 ? 'inactive' : 'active',
}));

const columns = [
  { id: 'name', label: 'Tên lớp', render: (row: typeof classData[0]) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ fontWeight: 500, color: '#1C252E', fontSize: 14 }}>{row.name}</Box>
      <Box sx={{ color: '#919EAB', fontSize: 12 }}>{row.code}</Box>
    </Box>
  ), sortable: true },
  { id: 'course', label: 'Khóa học', render: (row: typeof classData[0]) => <Box sx={{ fontSize: 14, color: '#1C252E' }}>{row.course}</Box> },
  { id: 'teacher', label: 'Giáo viên', render: (row: typeof classData[0]) => <Box sx={{ fontSize: 14, color: '#1C252E' }}>{row.teacher}</Box> },
  { id: 'students', label: 'Học viên', render: (row: typeof classData[0]) => <Box sx={{ fontSize: 14, color: '#1C252E' }}>{row.students}</Box>, sortable: true },
  { id: 'status', label: 'Trạng thái', render: (row: typeof classData[0]) => (
    <StatusBadge variant={row.status === 'active' ? 'success' : 'neutral'} label={row.status === 'active' ? 'Đang hoạt động' : 'Dừng hoạt động'} />
  )},
];

export default function ClassList() {
  const [page, setPage] = useState(0);

  return (
    <Box>
      <PageHeader
        title="Danh sách lớp học"
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Lớp học' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} sx={{
            bgcolor: '#696CFF', color: '#FFF', textTransform: 'none', fontSize: 14, fontWeight: 600,
            minHeight: 36, px: 2, borderRadius: 1,
            '&:hover': { bgcolor: '#585BE0' },
          }}>
            Tạo lớp học
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={classData}
        totalCount={classData.length}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        getId={(row) => row.id}
      />
    </Box>
  );
}
