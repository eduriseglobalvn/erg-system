'use client';

import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';

const assignmentData = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  title: ['Bài tập Lesson 1', 'SPEAKING TEST', 'Reading sprint', 'Review test 1', 'Bảng tính SUM'][i % 5],
  code: `***${['F5CC', 'F344', '89E7', '3D5C', '750B'][i % 5]}`,
  type: ['Bài tập về nhà', 'Kiểm tra', 'Luyện tập', 'Kiểm tra định kỳ', 'Thực hành'][i % 5],
  class: ['IELTS 7.0', 'P1', 'IELTS 6.5+'][i % 3],
  assigned: `${Math.floor(Math.random() * 30) + 10}`,
  submitted: `${Math.floor(Math.random() * 10)}`,
  avgScore: (Math.random() * 5 + 3).toFixed(1),
  dueDate: `${10 + (i % 15)}/06/2026`,
}));

const columns = [
  { id: 'title', label: 'Tiêu đề bài tập', render: (row: typeof assignmentData[0]) => (
    <Box>
      <Box sx={{ fontWeight: 500, color: '#1C252E', fontSize: 14 }}>{row.title}</Box>
      <Box sx={{ color: '#919EAB', fontSize: 12 }}>{row.code}</Box>
    </Box>
  ), sortable: true },
  { id: 'type', label: 'Nhóm bài tập', render: (row: typeof assignmentData[0]) => <Box sx={{ fontSize: 14, color: '#637381' }}>{row.type}</Box> },
  { id: 'class', label: 'Lớp', render: (row: typeof assignmentData[0]) => <Box sx={{ fontSize: 14, color: '#1C252E' }}>{row.class}</Box> },
  { id: 'assigned', label: 'Đã giao', render: (row: typeof assignmentData[0]) => <Box sx={{ fontSize: 14, color: '#1C252E' }}>{row.assigned}</Box>, sortable: true },
  { id: 'submitted', label: 'Đã nộp', render: (row: typeof assignmentData[0]) => <Box sx={{ fontSize: 14, color: '#1C252E' }}>{row.submitted}</Box>, sortable: true },
  { id: 'avgScore', label: 'Điểm TB', render: (row: typeof assignmentData[0]) => <Box sx={{ fontSize: 14, color: '#1C252E' }}>{row.avgScore}</Box>, sortable: true },
  { id: 'dueDate', label: 'Ngày đến hạn', render: (row: typeof assignmentData[0]) => <Box sx={{ fontSize: 14, color: '#637381' }}>{row.dueDate}</Box>, sortable: true },
];

export default function AssignmentList() {
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <PageHeader
        title="Danh sách bài tập"
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Bài tập' }]}
      />
      <Box sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 40, '& .MuiTab-root': { textTransform: 'none', minHeight: 40, px: 3 } }}>
          <Tab label="Tất cả" />
          <Tab label="Bài tập về nhà" />
          <Tab label="Kiểm tra" />
          <Tab label="Luyện tập" />
        </Tabs>
      </Box>
      <DataTable
        columns={columns}
        data={assignmentData.slice(0, 10)}
        totalCount={assignmentData.length}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        getId={(row) => row.id}
      />
    </Box>
  );
}
