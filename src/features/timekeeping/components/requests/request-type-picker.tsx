import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";

import { ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { RequestFormType } from "./request-model";
import { useRequestsNav } from "./use-requests-nav";

const TYPES: Array<{ type: RequestFormType; title: string; description: string; icon: ReactElement }> = [
  { type: "leave", title: "Nghỉ phép", description: "Phép năm, nghỉ ốm, việc riêng có lương, không lương", icon: <EventBusyOutlinedIcon /> },
  { type: "explanation", title: "Giải trình chấm công", description: "Quên chấm hoặc chấm lỗi một ngày làm việc", icon: <FactCheckOutlinedIcon /> },
  { type: "wfh", title: "Làm việc tại nhà", description: "Làm việc từ xa trong một hoặc nhiều ngày", icon: <HomeWorkOutlinedIcon /> },
  { type: "business", title: "Công tác", description: "Đi công tác ngoài trường", icon: <BusinessCenterOutlinedIcon /> },
];

/** G07: choose what to request. Choosing opens the matching form; nothing here is sent. */
export function RequestTypePicker() {
  const nav = useRequestsNav();
  return (
    <Box sx={{ display: "grid", gap: 2, maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgIconButton label="Quay lại" onClick={() => nav.toList()} sx={{ justifySelf: "start" }}><ArrowBackIcon /></ErgIconButton>
      <ErgPageHeader description="Người duyệt tự chọn theo quy trình của trường" title="Tạo đơn" />
      <Box component="ul" sx={{ display: "grid", gap: 1.5, listStyle: "none", m: 0, p: 0 }}>
        {TYPES.map((item) => (
          <li key={item.type}>
            <ButtonBase
              onClick={() => nav.toForm(item.type)}
              sx={{
                alignItems: "center",
                border: 1,
                borderColor: "divider",
                borderRadius: `${ergEnterpriseTokens.radius.card}px`,
                display: "flex",
                gap: 2,
                p: 2,
                textAlign: "left",
                width: "100%",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box sx={{ color: "primary.main", display: "flex" }}>{item.icon}</Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="div" variant="subtitle1">{item.title}</Typography>
                <Typography color="text.secondary" component="div" variant="body2">{item.description}</Typography>
              </Box>
            </ButtonBase>
          </li>
        ))}
      </Box>
    </Box>
  );
}
