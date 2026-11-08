import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import { ErgIconButton } from "@/components/erg-mui/erg-actions";
import type { RequestType } from "../../api/timekeeping-types";
import { IconTile, PunchCard, type TkTone } from "../punch/punch-card";
import { REQUEST_ICON } from "./request-list-item";
import { FORM_TYPE } from "./request-model";
import { useRequestsNav } from "./use-requests-nav";

type Choice = { type: RequestType; title: string; description: string; tone: TkTone };

// D15/D16: no substitute-teacher, overtime or compensatory-leave types.
const GROUPS: Array<{ name: string; items: Choice[] }> = [
  { name: "Vắng mặt", items: [{ type: "LEAVE", title: "Nghỉ phép", description: "Phép năm, nghỉ ốm, việc riêng có lương, không lương", tone: "info" }] },
  {
    name: "Chấm công",
    items: [
      { type: "EXPLANATION", title: "Giải trình chấm công", description: "Quên chấm, lỗi thiết bị, ngoài vùng chấm", tone: "error" },
      { type: "BUSINESS", title: "Công tác", description: "Tập huấn, dự giờ, coi thi — vẫn tính công", tone: "success" },
      { type: "WFH", title: "Làm việc tại nhà", description: "Làm việc từ xa trong một hoặc nhiều ngày", tone: "success" },
    ],
  },
];

/** G07: choose what to request. Choosing opens the matching form; nothing here is sent. */
export function RequestTypePicker() {
  const nav = useRequestsNav();
  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, mx: -1 }}>
        <ErgIconButton label="Quay lại" onClick={() => nav.toList()}><ArrowBackIcon /></ErgIconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h1" variant="h4">Tạo đơn mới</Typography>
          <Typography color="text.secondary" variant="caption">Người duyệt tự chọn theo quy trình của trường</Typography>
        </Box>
      </Box>
      {GROUPS.map((group) => (
        <Box key={group.name} sx={{ display: "grid", gap: 1 }}>
          <Typography color="text.secondary" component="h2" variant="overline">{group.name}</Typography>
          <PunchCard component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {group.items.map((item) => {
              const Icon = REQUEST_ICON[item.type];
              return (
                <Box component="li" key={item.type} sx={{ "& + &": { borderTop: 1, borderColor: "divider" } }}>
                  <ButtonBase onClick={() => nav.toForm(FORM_TYPE[item.type])} sx={{ alignItems: "center", display: "flex", gap: 1.5, minHeight: 62, px: 2, py: 1.25, textAlign: "left", width: "100%", "&:hover": { bgcolor: "action.hover" } }}>
                    <IconTile small tone={item.tone}><Icon /></IconTile>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography component="div" variant="subtitle2">{item.title}</Typography>
                      <Typography color="text.secondary" component="div" variant="caption">{item.description}</Typography>
                    </Box>
                    <ChevronRightIcon aria-hidden sx={{ color: "text.secondary" }} />
                  </ButtonBase>
                </Box>
              );
            })}
          </PunchCard>
        </Box>
      ))}
    </Box>
  );
}
