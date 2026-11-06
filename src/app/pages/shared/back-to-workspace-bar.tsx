import ArrowBack from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

/** Way back for pages that render outside a portal shell (KE_HOACH 7.4: "không có đường quay lại"). */
export function BackToWorkspaceBar({ href }: { href: string }) {
  return (
    <Box sx={{ bgcolor: "background.default", px: { xs: 2, md: 3 }, pt: 2 }}>
      <Button href={href} size="small" startIcon={<ArrowBack />} sx={{ minHeight: 44 }} variant="text">
        Về trang chủ
      </Button>
    </Box>
  );
}
