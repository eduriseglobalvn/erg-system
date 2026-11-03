'use client';

import type { ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import ergEnterpriseTheme from './erg-enterprise-theme';

interface Props {
  children: ReactNode;
  portal?: 'admin' | 'teacher' | 'student' | 'crm' | 'lms' | 'lcms' | 'elearning' | 'default';
}

export function ErgMuiProvider({ children }: Props) {
  return (
    <ThemeProvider theme={ergEnterpriseTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default ErgMuiProvider;
