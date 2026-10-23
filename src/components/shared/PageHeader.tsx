'use client';

import type { ReactNode } from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" sx={{ fontSize: 20, fontWeight: 700, color: '#1C252E' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: 14, color: '#637381', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {actions}
          </Box>
        )}
      </Box>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<ChevronRightRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{ fontSize: 14, color: '#637381', mt: 1 }}
        >
          {breadcrumbs.map((item, i) => {
            const isLast = i === breadcrumbs.length - 1;
            if (isLast || !item.href) {
              return (
                <Typography key={i} sx={{ fontSize: 14, color: isLast ? '#919EAB' : '#637381', fontWeight: 400 }}>
                  {item.label}
                </Typography>
              );
            }
            return (
              <Link key={i} href={item.href} underline="hover" sx={{ fontSize: 14, color: '#1C252E', cursor: 'pointer', fontWeight: 400 }}>
                {item.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
    </Box>
  );
}
