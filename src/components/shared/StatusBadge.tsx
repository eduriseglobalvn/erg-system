/**
 * CenterUp StatusBadge — EXACT pixel match
 * Extracted from CenterUp staging via Playwright
 *
 * Variants:
 *   success: bg rgba(34,197,94,0.12) #118D57 — Hoàn thành, Đã duyệt
 *   warning: bg rgba(255,171,0,0.16) #B76E00  — Chờ duyệt, Đang thực hiện
 *   danger:  bg rgba(255,86,48,0.12) #B71D18  — Quá hạn, Huỷ
 *   info:    bg rgba(0,184,217,0.12) #007A8C   — Mới
 *   neutral: bg #F4F6F8 #637381                 — Chưa cập nhật
 */
'use client';

import { Chip, type ChipProps } from '@mui/material';
import type { ReactNode } from 'react';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default';

interface StatusBadgeProps {
  variant: StatusVariant;
  label?: string;
  children?: ReactNode;
  size?: 'small' | 'medium';
  className?: string;
}

const variantMap: Record<StatusVariant, ChipProps['color']> = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
  neutral: 'default',
  default: 'default',
};

export default function StatusBadge({ variant, label, children, size = 'small', className }: StatusBadgeProps) {
  const text = label || (typeof children === 'string' ? children : undefined) || '';
  return (
    <Chip
      label={text}
      color={variantMap[variant]}
      size={size}
      className={className}
    />
  );
}
