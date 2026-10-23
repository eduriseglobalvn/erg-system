import BadgeCheck from "@mui/icons-material/VerifiedRounded";
import Building2 from "@mui/icons-material/BusinessRounded";
import CheckCircle2 from "@mui/icons-material/CheckCircleRounded";
import KeyRound from "@mui/icons-material/KeyRounded";
import LockKeyhole from "@mui/icons-material/LockRounded";
import Mail from "@mui/icons-material/EmailRounded";
import Phone from "@mui/icons-material/PhoneRounded";
import Save from "@mui/icons-material/SaveRounded";
import ShieldCheck from "@mui/icons-material/SecurityRounded";
import UserRound from "@mui/icons-material/PersonRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import { Field, InfoTile, NoticeBox, PasswordInput, SectionHeader } from "@/features/profile/components/profile-primitives";
import type { PasswordFormState, ProfileFormState, ProfileNotice as Notice } from "@/features/profile/types/profile-types";
import { passwordScoreLabel } from "@/features/profile/utils/profile-utils";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

export function ProfileFormPanel({ account, form, isSaving, notice, onSave, onUpdate }: {
  account: TeacherAccount | null;
  form: ProfileFormState;
  isSaving: boolean;
  notice: Notice | null;
  onSave: () => Promise<void>;
  onUpdate: (field: keyof ProfileFormState, value: string) => void;
}) {
  return (
    <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 5)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","@media (min-width: 64rem)":{"padding":"calc(0.25rem * 6)"}}}>
      <SectionHeader
        icon={<UserRound sx={{ fontSize: 20 }} />}
        eyebrow="Thông tin cá nhân"
        title="Hồ sơ hiển thị trong LMS"
        description="Thông tin này dùng cho lời chào, phân quyền, danh sách thành viên và các luồng quản trị."
        action={
          <Button variant="contained" onClick={() => void onSave()} disabled={!account || isSaving} startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : <Save sx={{ fontSize: 16 }} />} sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.5rem","backgroundColor":"var(--erg-blue)","paddingInline":"calc(0.25rem * 4)","color":"#fff","&:hover":{"@media (hover: hover)":{"backgroundColor":"var(--erg-blue-hover)"}}}}>
            Lưu hồ sơ
          </Button>
        }
      />

      <NoticeBox notice={notice} />

      <Box component="div" sx={{"marginTop":"calc(0.25rem * 6)","display":"grid","gap":"calc(0.25rem * 4)","@media (min-width: 48rem)":{"gridTemplateColumns":"repeat(2, minmax(0, 1fr))"}}}>
        <Field icon={<UserRound sx={{ fontSize: 16 }} />} label="Họ và tên">
          <TextField fullWidth size="small" value={form.fullName} onChange={(event) => onUpdate("fullName", event.target.value)} placeholder="Nhập họ và tên" />
        </Field>
        <Field icon={<Phone sx={{ fontSize: 16 }} />} label="Số điện thoại">
          <TextField fullWidth size="small" value={form.phone} onChange={(event) => onUpdate("phone", event.target.value)} placeholder="Nhập số điện thoại" />
        </Field>
        <Field icon={<Mail sx={{ fontSize: 16 }} />} label="Email đăng nhập">
          <TextField fullWidth size="small" value={account?.email ?? ""} disabled slotProps={{ htmlInput: { readOnly: true } }} />
        </Field>
        <Field icon={<Building2 sx={{ fontSize: 16 }} />} label="Bộ phận">
          <TextField fullWidth size="small" value={form.department} onChange={(event) => onUpdate("department", event.target.value)} placeholder="ERG / LMS / Trung tâm" />
        </Field>
        <Field icon={<BadgeCheck sx={{ fontSize: 16 }} />} label="Chức danh">
          <TextField fullWidth size="small" value={form.title} onChange={(event) => onUpdate("title", event.target.value)} placeholder="Giáo viên / Quản trị viên" />
        </Field>
        <Field icon={<UserRound sx={{ fontSize: 16 }} />} label="Giới thiệu ngắn" fullWidth>
          <TextField fullWidth multiline minRows={4} value={form.bio} onChange={(event) => onUpdate("bio", event.target.value)} placeholder="Một vài dòng giới thiệu về vai trò hoặc chuyên môn của bạn" />
        </Field>
      </Box>
    </Box>
  );
}

export function SecurityPanel({
  account,
  canChangePassword,
  form,
  isSaving,
  notice,
  passwordScore,
  showPasswords,
  onChangePassword,
  onTogglePasswords,
  onUpdate,
}: {
  account: TeacherAccount | null;
  canChangePassword: boolean;
  form: PasswordFormState;
  isSaving: boolean;
  notice: Notice | null;
  passwordScore: number;
  showPasswords: boolean;
  onChangePassword: () => Promise<void>;
  onTogglePasswords: () => void;
  onUpdate: (field: keyof PasswordFormState, value: string) => void;
}) {
  const passwordType = showPasswords ? "text" : "password";

  return (
    <Box component="div" sx={{"display":"grid","gap":"calc(0.25rem * 5)"}}>
      <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 5)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","@media (min-width: 64rem)":{"padding":"calc(0.25rem * 6)"}}}>
        <SectionHeader
          icon={<ShieldCheck sx={{ fontSize: 20 }} />}
          eyebrow="Bảo mật tài khoản"
          title="Đổi mật khẩu đăng nhập"
          description="Mật khẩu mới được gửi thẳng tới BE và chỉ cho phép đổi mật khẩu của chính tài khoản đang đăng nhập."
          action={
            <Button variant="contained" onClick={() => void onChangePassword()} disabled={!canChangePassword || isSaving} startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : <KeyRound sx={{ fontSize: 16 }} />} sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.375rem","backgroundColor":"var(--erg-blue)","paddingInline":"calc(0.25rem * 4)","color":"#fff","&:hover":{"@media (hover: hover)":{"backgroundColor":"var(--erg-blue-hover)"}}}}>
              Đổi mật khẩu
            </Button>
          }
        />

        <NoticeBox notice={notice} />

        {!canChangePassword ? (
          <Box component="div" sx={{"marginTop":"calc(0.25rem * 5)","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.4% 0.12 95.746)","backgroundColor":"oklch(98.7% 0.022 95.277)","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(47.3% 0.137 46.201)"}}>
            Tài khoản này đang dùng provider {account?.provider ?? "khác"}, nên chưa bật đổi mật khẩu local trên màn hình này.
          </Box>
        ) : null}

        <Box component="div" sx={{"marginTop":"calc(0.25rem * 6)","display":"grid","gap":"calc(0.25rem * 4)","@media (min-width: 48rem)":{"gridTemplateColumns":"repeat(2, minmax(0, 1fr))"}}}>
          <Field icon={<LockKeyhole sx={{ fontSize: 16 }} />} label="Mật khẩu hiện tại" fullWidth>
            <PasswordInput
              disabled={!canChangePassword}
              type={passwordType}
              value={form.currentPassword}
              onChange={(value) => onUpdate("currentPassword", value)}
              onToggle={onTogglePasswords}
              show={showPasswords}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </Field>
          <Field icon={<KeyRound sx={{ fontSize: 16 }} />} label="Mật khẩu mới">
            <TextField fullWidth size="small" disabled={!canChangePassword} type={passwordType} value={form.nextPassword} onChange={(event) => onUpdate("nextPassword", event.target.value)} placeholder="Tối thiểu 8 ký tự" />
          </Field>
          <Field icon={<KeyRound sx={{ fontSize: 16 }} />} label="Nhập lại mật khẩu mới">
            <TextField fullWidth size="small" disabled={!canChangePassword} type={passwordType} value={form.confirmPassword} onChange={(event) => onUpdate("confirmPassword", event.target.value)} placeholder="Nhập lại mật khẩu mới" />
          </Field>
        </Box>

        <Box component="div" sx={{"marginTop":"calc(0.25rem * 5)","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","padding":"calc(0.25rem * 4)"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(37.2% 0.044 257.287)"}}>
            <span>Độ mạnh mật khẩu mới</span>
            <span>{passwordScoreLabel(passwordScore)}</span>
          </Box>
          <Box component="div" sx={{"marginTop":"calc(0.25rem * 3)","display":"grid","gridTemplateColumns":"repeat(4, minmax(0, 1fr))","gap":"calc(0.25rem * 2)"}}>
            {[0, 1, 2, 3].map((index) => (
              <Box key={index} sx={{ bgcolor: index < passwordScore ? "primary.main" : "divider", borderRadius: 999, height: 8 }} />
            ))}
          </Box>
          <Box component="p" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(55.4% 0.046 257.417)"}}>
            Gợi ý: dùng tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt để giảm rủi ro bị đoán mật khẩu.
          </Box>
        </Box>
      </Box>

      <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 5)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","@media (min-width: 64rem)":{"padding":"calc(0.25rem * 6)"}}}>
        <SectionHeader
          icon={<CheckCircle2 sx={{ fontSize: 20 }} />}
          eyebrow="Phiên đăng nhập"
          title="Thông tin xác thực hiện tại"
          description="Khu vực này giúp người dùng hiểu tài khoản đang đăng nhập bằng phương thức nào."
        />
        <Box component="div" sx={{"marginTop":"calc(0.25rem * 5)","display":"grid","gap":"calc(0.25rem * 3)","@media (min-width: 48rem)":{"gridTemplateColumns":"repeat(3, minmax(0, 1fr))"}}}>
          <InfoTile label="Provider" value={account?.provider ?? "Không rõ"} />
          <InfoTile label="Trạng thái" value={account?.status ?? "Không rõ"} />
          <InfoTile label="Onboarding" value={account?.isProfileCompleted ? "Đã hoàn tất" : "Cần bổ sung"} />
        </Box>
      </Box>
    </Box>
  );
}
