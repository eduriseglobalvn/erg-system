import BadgeCheck from "@mui/icons-material/VerifiedRounded";
import Building2 from "@mui/icons-material/BusinessRounded";
import CheckCircle2 from "@mui/icons-material/CheckCircleRounded";
import KeyRound from "@mui/icons-material/KeyRounded";
import LockKeyhole from "@mui/icons-material/LockRounded";
import Mail from "@mui/icons-material/EmailRounded";
import Phone from "@mui/icons-material/PhoneRounded";
import Save from "@mui/icons-material/SaveRounded";
import UserRound from "@mui/icons-material/PersonRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Field, InfoTile, NoticeBox, PasswordInput, SectionHeader } from "@/features/profile/components/profile-primitives";
import type { PasswordFormState, ProfileFormState, ProfileNotice as Notice } from "@/features/profile/types/profile-types";
import { passwordScoreLabel } from "@/features/profile/utils/profile-utils";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

export function ProfileFormPanel({
  account,
  form,
  isSaving,
  notice,
  onSave,
  onUpdate,
}: {
  account: TeacherAccount | null;
  form: ProfileFormState;
  isSaving: boolean;
  notice: Notice | null;
  onSave: () => Promise<void>;
  onUpdate: (field: keyof ProfileFormState, value: string) => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
        p: { xs: 3, md: 3.5 },
      }}
    >
      <SectionHeader
        icon={<UserRound sx={{ fontSize: 22 }} />}
        eyebrow="Thông tin cá nhân"
        title="Hồ sơ hiển thị trong LMS"
        description="Thông tin này dùng cho lời chào, phân quyền, danh sách thành viên và các luồng quản trị."
        action={
          <Button
            disabled={!account || isSaving}
            onClick={() => void onSave()}
            startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : <Save sx={{ fontSize: 16 }} />}
            variant="contained"
            sx={{
              bgcolor: "#0071E3",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0, 113, 227, 0.28)",
              color: "#FFFFFF",
              fontSize: "0.85rem",
              fontWeight: 650,
              minHeight: 38,
              px: 2,
              textTransform: "none",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: "#0077ED",
                boxShadow: "0 4px 14px rgba(0, 113, 227, 0.38)",
              },
            }}
          >
            Lưu hồ sơ
          </Button>
        }
      />

      <NoticeBox notice={notice} />

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mt: 3,
          "@media (min-width: 48rem)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <Field icon={<UserRound sx={{ fontSize: 16 }} />} label="Họ và tên">
          <TextField
            fullWidth
            onChange={(event) => onUpdate("fullName", event.target.value)}
            placeholder="Nhập họ và tên"
            size="small"
            value={form.fullName}
            sx={appleInputSx}
          />
        </Field>
        <Field icon={<Phone sx={{ fontSize: 16 }} />} label="Số điện thoại">
          <TextField
            fullWidth
            onChange={(event) => onUpdate("phone", event.target.value)}
            placeholder="Nhập số điện thoại"
            size="small"
            value={form.phone}
            sx={appleInputSx}
          />
        </Field>
        <Field icon={<Mail sx={{ fontSize: 16 }} />} label="Email đăng nhập">
          <TextField
            disabled
            fullWidth
            size="small"
            slotProps={{ htmlInput: { readOnly: true } }}
            value={account?.email ?? ""}
            sx={appleInputSx}
          />
        </Field>
        <Field icon={<Building2 sx={{ fontSize: 16 }} />} label="Bộ phận">
          <TextField
            fullWidth
            onChange={(event) => onUpdate("department", event.target.value)}
            placeholder="ERG / LMS / Trung tâm"
            size="small"
            value={form.department}
            sx={appleInputSx}
          />
        </Field>
        <Field icon={<BadgeCheck sx={{ fontSize: 16 }} />} label="Chức danh">
          <TextField
            fullWidth
            onChange={(event) => onUpdate("title", event.target.value)}
            placeholder="Giáo viên / Quản trị viên"
            size="small"
            value={form.title}
            sx={appleInputSx}
          />
        </Field>
        <Field fullWidth icon={<UserRound sx={{ fontSize: 16 }} />} label="Giới thiệu ngắn">
          <TextField
            fullWidth
            multiline
            minRows={3}
            onChange={(event) => onUpdate("bio", event.target.value)}
            placeholder="Một vài dòng giới thiệu về vai trò hoặc chuyên môn của bạn"
            value={form.bio}
            sx={appleInputSx}
          />
        </Field>
      </Box>
    </Paper>
  );
}

export function SecurityPanel({
  account,
  canChangePassword,
  form,
  isSaving,
  notice,
  onChangePassword,
  onTogglePasswords,
  onUpdate,
  passwordScore,
  showPasswords,
}: {
  account: TeacherAccount | null;
  canChangePassword: boolean;
  form: PasswordFormState;
  isSaving: boolean;
  notice: Notice | null;
  onChangePassword: () => Promise<void>;
  onTogglePasswords: () => void;
  onUpdate: (field: keyof PasswordFormState, value: string) => void;
  passwordScore: number;
  showPasswords: boolean;
}) {
  const passwordType = showPasswords ? "text" : "password";

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      {/* Change Password Card */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
          p: { xs: 3, md: 3.5 },
        }}
      >
        <SectionHeader
          icon={<LockKeyhole sx={{ fontSize: 22 }} />}
          eyebrow="Bảo mật tài khoản"
          title="Đổi mật khẩu"
          description="Mật khẩu mới yêu cầu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số để bảo đảm an toàn."
          action={
            <Button
              disabled={!canChangePassword || isSaving}
              onClick={() => void onChangePassword()}
              startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : <KeyRound sx={{ fontSize: 16 }} />}
              variant="contained"
              sx={{
                bgcolor: "#0071E3",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0, 113, 227, 0.28)",
                color: "#FFFFFF",
                fontSize: "0.85rem",
                fontWeight: 650,
                minHeight: 38,
                px: 2,
                textTransform: "none",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: "#0077ED",
                  boxShadow: "0 4px 14px rgba(0, 113, 227, 0.38)",
                },
              }}
            >
              Đổi mật khẩu
            </Button>
          }
        />

        <NoticeBox notice={notice} />

        {!canChangePassword ? (
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "rgba(255, 149, 0, 0.09)",
              border: "1px solid rgba(255, 149, 0, 0.22)",
              borderRadius: "12px",
              color: "#B45309",
              display: "flex",
              fontSize: "0.85rem",
              fontWeight: 600,
              gap: 1,
              mt: 2.5,
              p: 1.75,
            }}
          >
            Tài khoản này đang dùng provider {account?.provider ?? "khác"}, nên chưa bật đổi mật khẩu local trên màn hình này.
          </Box>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            mt: 3,
            "@media (min-width: 48rem)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <Field fullWidth icon={<LockKeyhole sx={{ fontSize: 16 }} />} label="Mật khẩu hiện tại">
            <PasswordInput
              disabled={!canChangePassword || isSaving}
              onChange={(value) => onUpdate("currentPassword", value)}
              onToggle={onTogglePasswords}
              placeholder="Nhập mật khẩu hiện tại"
              show={showPasswords}
              type={passwordType}
              value={form.currentPassword}
            />
          </Field>
          <Field icon={<KeyRound sx={{ fontSize: 16 }} />} label="Mật khẩu mới">
            <TextField
              disabled={!canChangePassword || isSaving}
              fullWidth
              onChange={(event) => onUpdate("nextPassword", event.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              size="small"
              type={passwordType}
              value={form.nextPassword}
              sx={appleInputSx}
            />
          </Field>
          <Field icon={<KeyRound sx={{ fontSize: 16 }} />} label="Nhập lại mật khẩu mới">
            <TextField
              disabled={!canChangePassword || isSaving}
              fullWidth
              onChange={(event) => onUpdate("confirmPassword", event.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              size="small"
              type={passwordType}
              value={form.confirmPassword}
              sx={appleInputSx}
            />
          </Field>
        </Box>

        {/* Password Strength Score Inset */}
        <Box
          sx={{
            bgcolor: "rgba(0, 0, 0, 0.02)",
            borderRadius: "12px",
            border: "1px solid rgba(0, 0, 0, 0.04)",
            mt: 3,
            p: 2,
          }}
        >
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 0.75 }}>
            <Typography sx={{ color: "#6E6E73", fontSize: "0.8rem", fontWeight: 600 }}>
              Độ mạnh mật khẩu mới
            </Typography>
            <Typography
              sx={{
                color: passwordScore >= 3 ? "#15803D" : passwordScore >= 2 ? "#B45309" : "#DC2626",
                fontSize: "0.8rem",
                fontWeight: 750,
              }}
            >
              {passwordScoreLabel(passwordScore)}
            </Typography>
          </Box>
          <LinearProgress
            value={(passwordScore / 4) * 100}
            variant="determinate"
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.06)",
              borderRadius: 9999,
              height: 6,
              "& .MuiLinearProgress-bar": {
                bgcolor: passwordScore >= 3 ? "#34C759" : passwordScore >= 2 ? "#FF9500" : "#FF3B30",
                borderRadius: 9999,
              },
            }}
          />
          <Typography sx={{ color: "#86868B", fontSize: "0.75rem", mt: 1 }}>
            Gợi ý: Dùng tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt để an toàn nhất.
          </Typography>
        </Box>
      </Paper>

      {/* Session Auth Info Card */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
          p: { xs: 3, md: 3.5 },
        }}
      >
        <SectionHeader
          icon={<CheckCircle2 sx={{ fontSize: 22 }} />}
          eyebrow="Phiên đăng nhập"
          title="Thông tin xác thực hiện tại"
          description="Khu vực này giúp người dùng hiểu tài khoản đang đăng nhập bằng phương thức nào."
        />
        <Box
          sx={{
            display: "grid",
            gap: 2,
            mt: 2.5,
            "@media (min-width: 48rem)": { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          <InfoTile label="Phương thức xác thực" value={account?.provider ?? "Không rõ"} />
          <InfoTile label="Trạng thái tài khoản" value={account?.status ?? "Không rõ"} />
          <InfoTile label="Quy trình onboarding" value={account?.isProfileCompleted ? "Đã hoàn tất" : "Cần bổ sung"} />
        </Box>
      </Paper>
    </Box>
  );
}

const appleInputSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#FFFFFF",
    borderRadius: "10px",
    fontSize: "0.85rem",
    fontWeight: 550,
    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.12)" },
    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.22)" },
    "&.Mui-focused fieldset": {
      borderColor: "#0071E3",
      boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.15)",
    },
  },
};
