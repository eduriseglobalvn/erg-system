/**
 * CenterUp DataTable — MUI + TanStack Table v8
 * EXACT CenterUp style:
 *   - Header: 14px/600 #637381, bg white, padding 6px 16px
 *   - Cell: 14px/400 #1C252E, padding 6px 16px
 *   - Border: 1px dashed rgba(145,158,171,0.2)
 *   - Row hover: bg rgba(105,108,255,0.02)
 *   - Pagination: "Dòng/trang 10", "1–10 trong 307"
 */
'use client';

import { useState, type ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  Box,
} from '@mui/material';

export interface Column<T> {
  id: string;
  label: string;
  render: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  getId: (row: T) => string;
  emptyMessage?: string;
  footerStart?: ReactNode;
  stickyHeader?: boolean;
  maxHeight?: string | number;
}

export default function DataTable<T>({
  columns,
  data,
  totalCount = 0,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  loading = false,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  getId,
  emptyMessage = 'Không có dữ liệu',
  footerStart,
  stickyHeader = false,
  maxHeight,
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortDir('asc');
    }
  };

  const allSelected = data.length > 0 && data.every(row => selectedIds.includes(getId(row)));
  const someSelected = data.some(row => selectedIds.includes(getId(row)));

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.(selectedIds.filter(id => !data.some(row => getId(row) === id)));
    } else {
      const newIds = [...selectedIds];
      data.forEach(row => {
        const id = getId(row);
        if (!newIds.includes(id)) newIds.push(id);
      });
      onSelectionChange?.(newIds);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  if (loading) {
    return (
      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: 'none' }}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell key={col.id} sx={tableHeadSx}>{col.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map(col => (
                  <TableCell key={col.id} sx={tableCellSx}>
                    <Box sx={{ height: 14, width: '60%', bgcolor: '#F4F6F8', borderRadius: 1, animation: 'pulse 1.5s infinite' }} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        boxShadow: 'none',
        border: 'none',
        maxHeight,
      }}
    >
      <Table stickyHeader={stickyHeader} sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            {selectable && (
              <TableCell sx={{ ...tableHeadSx, width: 48, padding: '6px 8px' }}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  onChange={handleSelectAll}
                  size="small"
                />
              </TableCell>
            )}
            {columns.map(col => (
              <TableCell
                key={col.id}
                sx={{ ...tableHeadSx, width: col.width, textAlign: col.align || 'left' }}
                sortDirection={sortBy === col.id ? sortDir : false}
              >
                {col.sortable ? (
                  <TableSortLabel
                    active={sortBy === col.id}
                    direction={sortBy === col.id ? sortDir : 'asc'}
                    onClick={() => handleSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : (
                  col.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center" sx={{ py: 8, color: '#637381', fontSize: 14 }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => {
              const id = getId(row);
              return (
                <TableRow
                  key={id}
                  hover
                  sx={{ '&:hover td': { bgcolor: 'rgba(105,108,255,0.02)' }, cursor: 'pointer' }}
                >
                  {selectable && (
                    <TableCell sx={{ ...tableCellSx, width: 48, padding: '6px 8px' }}>
                      <Checkbox
                        checked={selectedIds.includes(id)}
                        onChange={() => handleSelectOne(id)}
                        size="small"
                      />
                    </TableCell>
                  )}
                  {columns.map(col => (
                    <TableCell
                      key={col.id}
                      sx={{ ...tableCellSx, textAlign: col.align || 'left' }}
                    >
                      {col.render(row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {totalCount > 0 && (
        <Box
          sx={{
            alignItems: 'center',
            borderTop: '1px solid rgba(145,158,171,0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            minHeight: 52,
            px: footerStart ? 2 : 0,
          }}
        >
          {footerStart ? <Box sx={{ alignItems: 'center', display: 'flex', minWidth: 180 }}>{footerStart}</Box> : <Box />}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            rowsPerPage={pageSize}
            onPageChange={(_, p) => onPageChange?.(p)}
            onRowsPerPageChange={(e) => onPageSizeChange?.(parseInt(e.target.value, 10))}
            labelRowsPerPage="Dòng/trang"
            sx={{
              fontSize: 14,
              color: '#637381',
              borderTop: 0,
              '.MuiTablePagination-toolbar': { minHeight: 52 },
            }}
          />
        </Box>
      )}
    </TableContainer>
  );
}

const tableHeadSx = {
  fontWeight: 600,
  color: '#637381',
  fontSize: 14,
  padding: '6px 16px',
  borderBottom: '1px dashed rgba(145, 158, 171, 0.2)',
  background: '#FFFFFF',
  whiteSpace: 'nowrap' as const,
};

const tableCellSx = {
  fontWeight: 400,
  color: '#1C252E',
  fontSize: 14,
  padding: '6px 16px',
  borderBottom: '1px dashed rgba(145, 158, 171, 0.2)',
  background: '#FFFFFF',
};
