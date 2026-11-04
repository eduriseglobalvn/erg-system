/**
 * Thin alias kept for existing callers; the single badge implementation is ErgStatusChip (tinted, 22px, 12/500).
 */
'use client';

import type { ReactNode } from 'react';

import { ErgStatusChip } from '@/components/erg-mui/erg-feedback';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default';

interface StatusBadgeProps {
  variant: StatusVariant;
  label?: string;
  children?: ReactNode;
  size?: 'small' | 'medium';
  className?: string;
}

const toneByVariant = { success: 'success', warning: 'warning', danger: 'error', info: 'info', neutral: 'neutral', default: 'neutral' } as const;

export default function StatusBadge({ variant, label, children, className }: StatusBadgeProps) {
  const text = label || (typeof children === 'string' ? children : undefined) || '';
  return <ErgStatusChip className={className} dot={false} label={text} tone={toneByVariant[variant]} />;
}
