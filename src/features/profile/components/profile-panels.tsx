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
import { Field, InfoTile, NoticeBox, PasswordInput, SectionHeader, StickyActionBar } from "@/features/profile/components/profile-primitives";
import type { PasswordFormState, ProfileFormState, ProfileNotice as Notice } from "@/features/profile/types/profile-types";
import { passwordScoreLabel } from "@/features/profile/utils/profile-utils";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function ProfileFormPanel({
  account,
  form,
  isSaving,
  notice,
  showWorkRoleFields,
  onSave,
  onUpdate,
}: {
  account: TeacherAccount | null;
  form: ProfileFormState;
  isSaving: boolean;
  notice: Notice | null;
  showWorkRoleFields: boolean;
  onSave: () => Promise<void>;
  onUpdate: (field: keyof ProfileFormState, value: string) => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "16px",
        border: `1px solid ${ergEnterpriseTokens.color.border}`,
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
        p: { xs: 3, md: 3.5 },
      }}
    >
      <SectionHeader
        icon={<UserRound sx={{ fontSize: 22 }} />}
        eyebrow="Thông tin cá nhân"
        title="Hồ sơ hiển thị trong LMS"
        description="Thông tin này dùng cho lời chào, phân quyền, danh sách thành viên và các luồng quản trị."
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
        <Field htmlFor="profile-full-name" icon={<UserRound sx={{ fontSize: 16 }} />} label="Họ và tên">
          <TextField
            fullWidth
            id="profile-full-name"
            onChange={(event) => onUpdate("fullName", event.target.value)}
            placeholder="Nhập họ và tên"
            size="small"
            value={form.fullName}
            sx={appleInputSx}
          />
        </Field>
        <Field htmlFor="profile-phone" icon={<Phone sx={{ fontSize: 16 }} />} label="Số điện thoại">
          <TextField
            fullWidth
            id="profile-phone"
            onChange={(event) => onUpdate("phone", event.target.value)}
            placeholder="Nhập số điện thoại"
            size="small"
            value={form.phone}
            sx={appleInputSx}
          />
        </Field>
        <Field htmlFor="profile-email" icon={<Mail sx={{ fontSize: 16 }} />} label="Email đăng nhập">
          <TextField
            disabled
            fullWidth
            id="profile-email"
            size="small"
            slotProps={{ htmlInput: { readOnly: true } }}
            value={account?.email ?? ""}
            sx={appleInputSx}
          />
        </Field>
        {showWorkRoleFields ? (
          <>
            <Field htmlFor="profile-department" icon={<Building2 sx={{ fontSize: 16 }} />} label="Bộ phận">
              <TextField
                fullWidth
                id="profile-department"
                onChange={(event) => onUpdate("department", event.target.value)}
                placeholder="ERG / LMS / Trung tâm"
                size="small"
                value={form.department}
                sx={appleInputSx}
              />
            </Field>
            <Field htmlFor="profile-title" icon={<BadgeCheck sx={{ fontSize: 16 }} />} label="Chức danh">
              <TextField
                fullWidth
                id="profile-title"
                onChange={(event) => onUpdate("title", event.target.value)}
                placeholder="Giáo viên / Quản trị viên"
                size="small"
                value={form.title}
                sx={appleInputSx}
              />
            </Field>
          </>
        ) : null}
        <Field fullWidth htmlFor="profile-bio" icon={<UserRound sx={{ fontSize: 16 }} />} label="Giới thiệu ngắn">
          <TextField
            fullWidth
            id="profile-bio"
            multiline
            minRows={3}
            onChange={(event) => onUpdate("bio", event.target.value)}
            placeholder="Một vài dòng giới thiệu về vai trò hoặc chuyên môn của bạn"
            value={form.bio}
            sx={appleInputSx}
          />
        </Field>
      </Box>

      <StickyActionBar>
        <Button
          disabled={!account || isSaving}
          onClick={() => void onSave()}
          startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : <Save sx={{ fontSize: 16 }} />}
          variant="contained"
        >
          Lưu hồ sơ
        </Button>
      </StickyActionBar>
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
          border: `1px solid ${ergEnterpriseTokens.color.border}`,
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 24px -4px rgba(0, 0, 0, 0.04)",
          p: { xs: 3, md: 3.5 },
        }}
      >
        <SectionHeader
          icon={<LockKeyhole sx={{ fontSize: 22 }} />}
          eyebrow="Bảo mật tài khoản"
          title="Đổi mật khẩu"
          description="Mật khẩu mới yêu cầu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số để bảo đảm an toàn."
        />

        <NoticeBox notice={notice} />

        {!canChangePassword ? (
          <Box
            sx={{
              alignItems: "center",
              bgcolor: alpha(ergEnterpriseTokens.color.warning, 0.09),
              border: `1px solid ${alpha(ergEnterpriseTokens.color.warning, 0.22)}`,
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
          <Field fullWidth htmlFor="profile-current-password" icon={<LockKeyhole sx={{ fontSize: 16 }} />} label="Mật khẩu hiện tại">
            <PasswordInput
              disabled={!canChangePassword || isSaving}
              id="profile-current-password"
              onChange={(value) => onUpdate("currentPassword", value)}
              onToggle={onTogglePasswords}
              placeholder="Nhập mật khẩu hiện tại"
              show={showPasswords}
              type={passwordType}
              value={form.currentPassword}
            />
          </Field>
          <Field htmlFor="profile-next-password" icon={<KeyRound sx={{ fontSize: 16 }} />} label="Mật khẩu mới">
            <TextField
              disabled={!canChangePassword || isSaving}
              fullWidth
              id="profile-next-password"
              onChange={(event) => onUpdate("nextPassword", event.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              size="small"
              type={passwordType}
              value={form.nextPassword}
              sx={appleInputSx}
            />
          </Field>
          <Field htmlFor="profile-confirm-password" icon={<KeyRound sx={{ fontSize: 16 }} />} label="Nhập lại mật khẩu mới">
            <TextField
              disabled={!canChangePassword || isSaving}
              fullWidth
              id="profile-confirm-password"
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
            border: `1px solid ${ergEnterpriseTokens.color.border}`,
            mt: 3,
            p: 2,
          }}
        >
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 0.75 }}>
            <Typography sx={{ color: "text.secondary", fontSize: "0.8rem", fontWeight: 600 }}>
              Độ mạnh mật khẩu mới
            </Typography>
            <Typography
              sx={{
                color: passwordScore >= 3 ? "#15803D" : passwordScore >= 2 ? "#B45309" : "#DC2626",
                fontSize: "0.8rem",
                fontWeight: 600,
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
                bgcolor: passwordScore >= 3 ? "success.main" : passwordScore >= 2 ? "warning.main" : ergEnterpriseTokens.color.danger,
                borderRadius: 9999,
              },
            }}
          />
          <Typography sx={{ color: "text.disabled", fontSize: "0.75rem", mt: 1 }}>
            Gợi ý: Dùng tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt để an toàn nhất.
          </Typography>
        </Box>

        <StickyActionBar>
          <Button
            disabled={!canChangePassword || isSaving}
            onClick={() => void onChangePassword()}
            startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : <KeyRound sx={{ fontSize: 16 }} />}
            variant="contained"
          >
            Đổi mật khẩu
          </Button>
        </StickyActionBar>
      </Paper>

      {/* Session Auth Info Card */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "16px",
          border: `1px solid ${ergEnterpriseTokens.color.border}`,
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
    borderRadius: `${ergEnterpriseTokens.radius.md}px`,
    fontSize: "0.85rem",
    fontWeight: 550,
    "& fieldset": { borderColor: "divider" },
    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.22)" },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
      boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
    },
  },
};
