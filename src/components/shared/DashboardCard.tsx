/**
 * ERG DashboardCard — compact operational panel
 *   - Border: 1px solid rgba(145,158,171,0.12)
 *   - Radius: 8px
 *   - Padding: 20px 24px
 *   - Header: h6 (18px/600) + "Xem tất cả" link
 *   - Separator: border-b rgba(145,158,171,0.12)
 *   - Footer: Thu gọn checkbox
 */
'use client';

import { useState, type ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Button,
  Checkbox,
  Collapse,
  Divider,
} from '@mui/material';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  badge?: string | number;
}

export default function DashboardCard({
  title,
  children,
  action,
  actionText = 'Xem tất cả',
  onAction,
  collapsible = true,
  defaultCollapsed = false,
  className,
  badge,
}: DashboardCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <Card
      className={className}
      sx={{
        border: '1px solid rgba(145,158,171,0.12)',
        borderRadius: 2,
        boxShadow: 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600, color: '#1C252E' }}>
              {title}
            </Typography>
            {badge !== undefined && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 24,
                  height: 24,
                  px: 1,
                  borderRadius: '10px',
                  bgcolor: 'rgba(145,158,171,0.16)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#1C252E',
                }}
              >
                {badge}
              </Box>
            )}
          </Box>
        }
        action={
          action || (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {onAction && (
                <Button
                  size="small"
                  onClick={onAction}
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#696CFF',
                    textTransform: 'none',
                    minHeight: 30,
                    '&:hover': { bgcolor: 'rgba(105,108,255,0.08)' },
                  }}
                >
                  {actionText}
                </Button>
              )}
              {collapsible && (
                <Checkbox
                  checked={!collapsed}
                  onChange={() => setCollapsed(!collapsed)}
                  size="small"
                  icon={<span style={{ fontSize: 12, color: '#919EAB' }}>Thu gọn</span>}
                  checkedIcon={<span style={{ fontSize: 12, color: '#696CFF' }}>Thu gọn</span>}
                  sx={{ '& .MuiSvgIcon-root': { display: 'none' } }}
                />
              )}
            </Box>
          )
        }
        sx={{
          px: 3,
          pt: 2.5,
          pb: 0,
          '& .MuiCardHeader-action': { alignSelf: 'center', marginTop: 0 },
        }}
      />
      <Divider sx={{ mx: 3, borderColor: 'rgba(145,158,171,0.12)' }} />
      <CardContent sx={{ px: 3, py: 2, flex: 1, overflow: 'auto', '&:last-child': { pb: 2 } }}>
        <Collapse in={!collapsed} timeout={200}>
          {children}
        </Collapse>
      </CardContent>
    </Card>
  );
}
