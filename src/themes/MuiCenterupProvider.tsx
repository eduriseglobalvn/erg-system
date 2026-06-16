/**
 * MUI CenterUp Theme Provider
 * Chỉ wrap cho LMS, LCMS, CRM portals.
 * Elearning và các UI khác giữ nguyên shadcn/ui.
 */
'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import centerupTheme from './centerup-theme';

interface Props {
  children: ReactNode;
  /** Portal type để phân biệt MUI vs non-MUI */
  portal?: 'lms' | 'lcms' | 'crm' | 'elearning' | 'default';
}

export default function MuiCenterupProvider({ children, portal = 'default' }: Props) {
  // Chỉ dùng MUI cho LMS, LCMS, CRM
  const useMui = portal === 'lms' || portal === 'lcms' || portal === 'crm';

  if (!useMui) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider theme={centerupTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
