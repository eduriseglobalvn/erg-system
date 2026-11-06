import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';

function getInitials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const headerIconButtonSx = {
  color: '#637381',
  height: 36,
  ml: 0.5,
  width: 36,
  '&:hover': {
    bgcolor: 'rgba(145,158,171,0.08)',
  },
};

export function CrmPortalHeader({ fullName, unreadCount }: { fullName?: string; unreadCount?: number }) {

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(10px)',
        border: '0 !important',
        boxShadow: 'none',
        color: '#1C252E',
        zIndex: 1200,
      }}
    >
      <Toolbar sx={{ minHeight: '72px !important', px: '32px !important' }}>
        {/* Left: Portal selector */}
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, height: 32, minWidth: 266 }}>
          <Box
            component="svg"
            sx={{ height: 32, width: 80 }}
          >
            <text x="0" y="24" fontFamily="Manrope Variable, sans-serif" fontSize="22" fontWeight="800" fill="#1C252E">ERG</text>
            <text x="0" y="36" fontFamily="Manrope Variable, sans-serif" fontSize="9" fontWeight="600" fill="#0071E3" letterSpacing="2">EDUCATION</text>
          </Box>
          <Typography sx={{ color: '#1C252E', fontSize: 14, fontWeight: 600, lineHeight: '22px' }}>
            CRM ERG
          </Typography>
          <Box
            component="span"
            sx={{
              bgcolor: 'rgba(0,184,217,0.16)',
              borderRadius: '6px',
              color: '#006C9C',
              fontSize: 12,
              fontWeight: 600,
              height: 22,
              lineHeight: '22px',
              px: 1.5,
            }}
          >
            ADVANCED
          </Box>
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Connection quality */}
        <Tooltip title="Chất lượng kết nối">
          <Box
            sx={{
              alignItems: 'center',
              bgcolor: '#FFFFFF',
              border: '1px solid rgba(145,158,171,0.12)',
              borderRadius: 1,
              color: '#22C55E',
              display: 'flex',
              gap: 1,
              height: 34,
              px: 1,
            }}
          >
            <WifiRoundedIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ color: '#22C55E', fontSize: 12, fontWeight: 400, lineHeight: '18px' }}>
              Mạng tốt
            </Typography>
          </Box>
        </Tooltip>

        {/* Search */}
        <Tooltip title="Tìm kiếm nhanh">
          <Box
            component="button"
            type="button"
            sx={{
              alignItems: 'center',
              bgcolor: 'rgba(145,158,171,0.08)',
              border: 0,
              borderRadius: 1,
              color: '#637381',
              cursor: 'pointer',
              display: 'flex',
              gap: 0.75,
              height: 36,
              ml: 1,
              px: 1,
            }}
          >
            <SearchRoundedIcon sx={{ fontSize: 18 }} />
            <Box
              component="span"
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: '6px',
                color: '#1C252E',
                fontSize: 12,
                fontWeight: 600,
                height: 24,
                lineHeight: '24px',
                px: 0.75,
              }}
            >
              ⌘K
            </Box>
          </Box>
        </Tooltip>

        {/* Language */}
        <Tooltip title="Ngôn ngữ">
          <IconButton
            sx={{
              bgcolor: '#F51F24',
              borderRadius: '6px',
              color: '#FFDE59',
              height: 24,
              ml: 1,
              width: 32,
              '&:hover': { bgcolor: '#DB1D22' },
            }}
          >
            <Typography sx={{ color: 'inherit', fontSize: 10, fontWeight: 600, lineHeight: 1 }}>
              VN
            </Typography>
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Badge badgeContent={unreadCount} color="error" max={99} sx={{ ml: 0.5 }}>
          <Tooltip title="Thông báo">
            <IconButton sx={headerIconButtonSx}>
              <NotificationsNoneRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Badge>

        {/* Settings */}
        <Tooltip title="Thiết lập">
          <IconButton sx={headerIconButtonSx}>
            <SettingsRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        {/* User avatar */}
        <Tooltip title={fullName || 'User'}>
          <IconButton sx={{ height: 48, ml: 0.5, width: 48 }}>
            <Avatar
              sx={{
                bgcolor: '#0071E3',
                border: '2px solid #FFD666',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                height: 32,
                width: 32,
              }}
            >
              {getInitials(fullName || 'CRM')}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
