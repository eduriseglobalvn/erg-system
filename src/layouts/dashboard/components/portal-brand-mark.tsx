import { ERG_ASSETS } from "@/config/seo";
import Box from "@mui/material/Box";

type PortalBrandMarkProps = {
  title: string;
  subtitle?: string;
};

export function PortalBrandMark({ title }: PortalBrandMarkProps) {
  return (
    <Box sx={{ alignItems: "center", borderBottom: "1px solid", borderColor: "divider", display: "flex", height: 64, px: 2.5 }}>
      <Box component="img" src={ERG_ASSETS.logo} alt={title} sx={{ height: 36, objectFit: "contain", objectPosition: "left", width: 110 }} />
    </Box>
  );
}
