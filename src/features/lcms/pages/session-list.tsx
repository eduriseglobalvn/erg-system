'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';

type SessionStatus = 'upcoming' | 'done' | 'cancelled';

const sessionData = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  name: `Buổi ${i + 1} - Unit ${Math.floor(i / 3) + 1}`,
  class: ['IELTS 7.0', 'IELTS 6.5+', 'P1', 'TOEIC 600+'][i % 4],
  teacher: ['Phan Ngọc Ánh', 'Nguyễn Thị Nhung', 'Tina'][i % 3],
  date: `${String(10 + (i % 20)).padStart(2, '0')}/06/2026`,
  status: (i % 5 === 0 ? 'cancelled' : i % 4 === 0 ? 'done' : 'upcoming') as SessionStatus,
}));

const columns = [
  { id: 'name', label: 'Buổi học', render: (row: typeof sessionData[0]) => (
    <Box sx={{ fontWeight: 500, color: '#1C252E', fontSize: 14 }}>{row.name}</Box>
  ), sortable: true },
  { id: 'class', label: 'Lớp học', render: (row: typeof sessionData[0]) => <Box sx={{ fontSize: 14, color: '#1C252E' }}>{row.class}</Box> },
  { id: 'teacher', label: 'Giáo viên', render: (row: typeof sessionData[0]) => <Box sx={{ fontSize: 14, color: '#1C252E' }}>{row.teacher}</Box> },
  { id: 'date', label: 'Ngày', render: (row: typeof sessionData[0]) => <Box sx={{ fontSize: 14, color: '#637381' }}>{row.date}</Box>, sortable: true },
  { id: 'status', label: 'Trạng thái', render: (row: typeof sessionData[0]) => {
    const map = { upcoming: 'info', done: 'success', cancelled: 'danger' } as const;
    return <StatusBadge variant={map[row.status]} label={row.status === 'upcoming' ? 'Sắp diễn ra' : row.status === 'done' ? 'Đã kết thúc' : 'Đã hủy'} />;
  }},
];

export default function SessionList() {
  const [page, setPage] = useState(0);
  return (
    <Box>
      <PageHeader
        title="Danh sách buổi học"
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Buổi học' }]}
      />
      <DataTable
        columns={columns}
        data={sessionData}
        totalCount={sessionData.length}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        getId={(row) => row.id}
      />
    </Box>
  );
}
