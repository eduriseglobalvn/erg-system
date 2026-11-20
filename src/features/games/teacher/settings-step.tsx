import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RemoveIcon from "@mui/icons-material/Remove";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import { AppSelect } from "@/components/erg-mui/app-select";
import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import type { GameSource, RoomRules } from "@/features/games/game-types";
import { HACK_GAME_DISPLAY_NAME } from "@/features/games/hack/hack-tokens";
import { darkOutlineSx, stageSx } from "@/features/games/teacher/picker-step";
import { clampDuration, describeFiltered, DURATION_MAX, DURATION_MIN, type RoomSettings } from "@/features/games/teacher/room-settings";

type SettingsStepProps = {
  settings: RoomSettings;
  classes: { id: string; label: string }[];
  source: GameSource | undefined;
  /** First problem from validateSettings, shown under the form; null when valid. */
  problem: string | null;
  failure: string | null;
  busy: boolean;
  onChange: (next: RoomSettings) => void;
  onBack: () => void;
  onSubmit: () => void;
};

type SwitchKey = "showLeaderboard" | "showSolution" | "allowLateJoin";
const SWITCHES: { key: SwitchKey; label: string; hint: string }[] = [
  { key: "showLeaderboard", label: "Hiện bảng xếp hạng", hint: "Trên máy học sinh trong lúc chơi." },
  { key: "showSolution", label: "Hiện đáp án đúng khi sai", hint: "Kèm lời giải của LMS." },
  { key: "allowLateJoin", label: "Cho vào muộn", hint: "Học sinh vào sau khi ván đã bắt đầu." },
];
const LOCKED = [
  { label: "Cho phép hack", hint: "Lấy xu của nhau bằng một câu khó." },
  { label: "Vá khẩn cấp", hint: "Người bị hack được trả lời 1 câu để chặn." },
];
const ORDERS: { value: RoomRules["questionOrder"]; label: string }[] = [
  { value: "RANDOM", label: "Ngẫu nhiên" },
  { value: "LESSON", label: "Theo bài" },
  { value: "WRONG_FIRST", label: "Ưu tiên câu sai" },
];

function Label({ children }: { children: string }) {
  return <Typography variant="subtitle2" sx={{ mb: 0.75, color: "text.secondary" }}>{children}</Typography>;
}

function Choice({ title, hint, selected, disabled }: { title: string; hint: string; selected?: boolean; disabled?: boolean }) {
  return (
    <Box sx={{ flex: 1, p: 1.5, borderRadius: 1.5, border: 1, borderColor: selected ? "primary.main" : "divider", bgcolor: selected ? "action.selected" : "transparent", opacity: disabled ? 0.55 : 1 }}>
      <Typography variant="subtitle2" sx={{ color: selected ? "primary.main" : "text.primary" }}>{title}</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>{hint}</Typography>
    </Box>
  );
}

/** LMS 3 · Cài đặt phòng (LmsSettings): class, duration, question set and the room rules. */
export function SettingsStep({ settings, classes, source, problem, failure, busy, onChange, onBack, onSubmit }: SettingsStepProps) {
  const set = <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) => onChange({ ...settings, [key]: value });
  const filtered = source ? describeFiltered(source.filteredByKind) : "";
  return (
    <Box sx={{ ...stageSx, p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <ErgButton variant="outlined" size="small" leadingIcon={<ArrowBackIcon />} onClick={onBack} sx={darkOutlineSx}>Chọn trò khác</ErgButton>
        <Chip label={`> ${HACK_GAME_DISPLAY_NAME}`} variant="outlined" sx={{ color: "inherit", borderColor: "inherit" }} />
        <Typography component="h1" variant="h4" sx={{ fontWeight: "fontWeightBold" }}>Cài đặt phòng</Typography>
        <Typography variant="body2" sx={{ ml: "auto", opacity: 0.8 }}>Bước 2/2{source ? ` · ${source.title}` : ""}</Typography>
      </Box>
      <Paper sx={{ flex: 1, p: { xs: 2, md: 3 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4, color: "text.primary" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Label>Ván kết thúc khi</Label>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Choice title="Hết giờ" hint="Dừng khi hết thời gian đã đặt." selected />
              <Choice title="Đủ sao" hint="Sắp có." disabled />
            </Box>
          </Box>
          <Box>
            <Label>Thời lượng</Label>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ErgIconButton label="Giảm 1 phút" onClick={() => set("durationMinutes", clampDuration(settings.durationMinutes - 1))} disabled={settings.durationMinutes <= DURATION_MIN}><RemoveIcon /></ErgIconButton>
              <Box sx={{ flex: 1, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 1.5, py: 1.25 }}>
                <Typography component="span" variant="h6" aria-live="polite">{settings.durationMinutes} phút</Typography>
              </Box>
              <ErgIconButton label="Tăng 1 phút" onClick={() => set("durationMinutes", clampDuration(settings.durationMinutes + 1))} disabled={settings.durationMinutes >= DURATION_MAX}><AddIcon /></ErgIconButton>
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Từ {DURATION_MIN} đến {DURATION_MAX} phút.</Typography>
          </Box>
          <Box>
            <Label>Lớp chơi</Label>
            <AppSelect aria-label="Lớp chơi" value={settings.classId} onChange={(event) => set("classId", event.target.value)}>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </AppSelect>
          </Box>
          <Box>
            <Label>Bộ câu</Label>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Choice title="Cả bài" hint="Mọi câu chơi được của bài." selected />
              <Choice title="Câu lớp hay sai" hint="Sắp có." disabled />
            </Box>
          </Box>
          <Box sx={{ mt: "auto", border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
            {source ? (
              <>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip size="small" color="success" label={`${source.playableCount} câu chơi được`} />
                  {source.filteredCount > 0 ? <Chip size="small" color="warning" label={`${source.filteredCount} câu bị lọc`} /> : null}
                </Box>
                {filtered ? <Typography variant="caption" sx={{ color: "text.secondary" }}>Bị lọc: {filtered}.</Typography> : null}
              </>
            ) : <Typography variant="caption" sx={{ color: "text.secondary" }}>Chưa có bài để chơi.</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="subtitle2">Luật riêng của {HACK_GAME_DISPLAY_NAME} <Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>· phần này mỗi trò một khác</Typography></Typography>
          {LOCKED.map((row) => (
            <Box key={row.label} sx={{ display: "flex", alignItems: "center", gap: 2, opacity: 0.6 }}>
              <Box sx={{ flex: 1 }}><Typography variant="subtitle2">{row.label}</Typography><Typography variant="caption" sx={{ color: "text.secondary" }}>{row.hint}</Typography></Box>
              <Switch checked={false} disabled slotProps={{ input: { "aria-label": row.label } }} />
            </Box>
          ))}
          <Alert severity="info" variant="outlined">Hack và vá khẩn cấp chưa mở ở đợt này, hai công tắc trên đang khóa tắt.</Alert>
          {SWITCHES.map((row) => (
            <Box key={row.key} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ flex: 1 }}><Typography variant="subtitle2">{row.label}</Typography><Typography variant="caption" sx={{ color: "text.secondary" }}>{row.hint}</Typography></Box>
              <Switch checked={settings[row.key]} onChange={(_, checked) => set(row.key, checked)} slotProps={{ input: { "aria-label": row.label } }} />
            </Box>
          ))}
          <Box>
            <Label>Thứ tự câu</Label>
            <ToggleButtonGroup exclusive fullWidth color="primary" size="small" value={settings.questionOrder} onChange={(_, value: RoomRules["questionOrder"] | null) => { if (value) set("questionOrder", value); }}>
              {ORDERS.map((order) => <ToggleButton key={order.value} value={order.value}>{order.label}</ToggleButton>)}
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ mt: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
            {failure ? <Alert severity="error">{failure}</Alert> : problem ? <Typography variant="caption" role="status" sx={{ color: "text.secondary" }}>{problem}</Typography> : null}
            <ErgButton variant="contained" size="large" fullWidth loading={busy} disabled={problem !== null} onClick={onSubmit}>Tạo phòng và lấy mã</ErgButton>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
