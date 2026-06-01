import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type SyntheticEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authApi } from "@/platform/auth/api/auth-api";
import { getCurrentAccount, saveCurrentAccount } from "@/platform/auth/api/auth-storage";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0A48FF] focus:ring-4 focus:ring-blue-100";
const textareaClassName =
  "min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0A48FF] focus:ring-4 focus:ring-blue-100";
const mutedInputClassName = `${inputClassName} bg-slate-50 text-slate-500`;

type ProfileFormState = {
  fullName: string;
  phone: string;
  department: string;
  title: string;
  avatarUrl: string;
  bio: string;
};

type PasswordFormState = {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
};

type ProfileTab = "profile" | "security";

type Notice = { tone: "success" | "error"; message: string };
const CROP_PREVIEW_SIZE = 320;
const CROP_OUTPUT_SIZE = 512;

type AvatarCropState = {
  file: File;
  previewUrl: string;
  zoom: number;
  offset: { x: number; y: number };
  image: { width: number; height: number } | null;
  drag: { pointerId: number; startX: number; startY: number; originX: number; originY: number } | null;
};
const emptyForm: ProfileFormState = {
  fullName: "",
  phone: "",
  department: "ERG",
  title: "Giáo viên",
  avatarUrl: "",
  bio: "",
};

const emptyPasswordForm: PasswordFormState = {
  currentPassword: "",
  nextPassword: "",
  confirmPassword: "",
};

export function ProfilePage() {
  const location = useLocation();
  const [account, setAccount] = useState<TeacherAccount | null>(() => getCurrentAccount());
  const [form, setForm] = useState<ProfileFormState>(() => toForm(getCurrentAccount()));
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [profileNotice, setProfileNotice] = useState<Notice | null>(null);
  const [securityNotice, setSecurityNotice] = useState<Notice | null>(null);
  const [avatarCrop, setAvatarCrop] = useState<AvatarCropState | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab === "profile" || tab === "security") {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    void authApi
      .profile()
      .then((profile) => {
        if (cancelled) return;
        const nextAccount: TeacherAccount = { ...profile, password: "" };
        setAccount(nextAccount);
        setForm(toForm(nextAccount));
        saveCurrentAccount(nextAccount);
      })
      .catch(() => {
        if (cancelled) return;
        const current = getCurrentAccount();
        setAccount(current);
        setForm(toForm(current));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    return () => {
      if (avatarCrop?.previewUrl) URL.revokeObjectURL(avatarCrop.previewUrl);
    };
  }, [avatarCrop?.previewUrl]);

  const initials = useMemo(() => getInitials(form.fullName || account?.email || "ERG"), [account?.email, form.fullName]);
  const avatarUrl = form.avatarUrl.trim();
  const completionItems = useMemo(
    () => [Boolean(form.fullName.trim()), Boolean(form.phone.trim()), Boolean(form.department.trim()), Boolean(form.title.trim())],
    [form.department, form.fullName, form.phone, form.title],
  );
  const completedCount = completionItems.filter(Boolean).length;
  const completionPercent = Math.round((completedCount / completionItems.length) * 100);
  const passwordScore = getPasswordScore(passwordForm.nextPassword);
  const canChangePassword = Boolean(account?.id && account.provider === "password");

  const update = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updatePasswordField = (field: keyof PasswordFormState, value: string) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async () => {
    if (!account) return;
    setIsSavingProfile(true);
    setProfileNotice(null);

    try {
      const updated = await authApi.updateProfile(account.id, form);
      const nextAccount: TeacherAccount = {
        ...account,
        ...updated,
        fullName: updated.fullName || form.fullName,
        phone: updated.phone || form.phone,
        department: form.department,
        title: form.title,
        avatarUrl: updated.avatarUrl || form.avatarUrl,
        bio: updated.bio || form.bio,
        password: "",
      };
      saveCurrentAccount(nextAccount);
      setAccount(nextAccount);
      setForm(toForm(nextAccount));
      setProfileNotice({ tone: "success", message: "Hồ sơ đã được cập nhật." });
    } catch (error) {
      setProfileNotice({ tone: "error", message: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!account || !canChangePassword) return;
    setIsSavingPassword(true);
    setSecurityNotice(null);

    try {
      const nextPassword = passwordForm.nextPassword.trim();
      if (!passwordForm.currentPassword.trim()) {
        throw new Error("Vui lòng nhập mật khẩu hiện tại.");
      }
      if (nextPassword.length < 8) {
        throw new Error("Mật khẩu mới cần tối thiểu 8 ký tự.");
      }
      if (nextPassword !== passwordForm.confirmPassword.trim()) {
        throw new Error("Mật khẩu xác nhận chưa khớp.");
      }
      await authApi.updatePassword(account.id, {
        currentPassword: passwordForm.currentPassword,
        nextPassword,
      });
      setPasswordForm(emptyPasswordForm);
      setSecurityNotice({ tone: "success", message: "Mật khẩu đã được thay đổi thành công." });
    } catch (error) {
      setSecurityNotice({ tone: "error", message: error instanceof Error ? error.message : "Không thể đổi mật khẩu." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const openAvatarCropper = (file: File | null) => {
    if (!file) return;
    setProfileNotice(null);

    if (!file.type.startsWith("image/")) {
      setProfileNotice({ tone: "error", message: "Vui lòng chọn file ảnh hợp lệ." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileNotice({ tone: "error", message: "Avatar tối đa 5MB." });
      return;
    }

    if (avatarCrop?.previewUrl) URL.revokeObjectURL(avatarCrop.previewUrl);
    setAvatarCrop({
      file,
      previewUrl: URL.createObjectURL(file),
      zoom: 1,
      offset: { x: 0, y: 0 },
      image: null,
      drag: null,
    });
  };

  const closeAvatarCropper = () => {
    setAvatarCrop((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  };

  const uploadCroppedAvatar = async () => {
    if (!account || !avatarCrop) return;
    setProfileNotice(null);
    setIsUploadingAvatar(true);

    try {
      const croppedFile = await createCroppedAvatarFile(avatarCrop);
      const updated = await authApi.uploadAvatar(account.id, croppedFile);
      const nextAccount: TeacherAccount = {
        ...account,
        ...updated,
        department: account.department,
        title: account.title,
        avatarUrl: updated.avatarUrl || account.avatarUrl || "",
        password: "",
      };
      saveCurrentAccount(nextAccount);
      setAccount(nextAccount);
      setForm((current) => ({ ...current, avatarUrl: nextAccount.avatarUrl ?? "" }));
      setProfileNotice({ tone: "success", message: "Avatar đã được căn chỉnh và upload lên R2 theo thư mục avatar/{userID}." });
      closeAvatarCropper();
    } catch (error) {
      setProfileNotice({ tone: "error", message: error instanceof Error ? error.message : "Không thể upload avatar." });
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  const primaryAction = activeTab === "security" ? changePassword : saveProfile;
  const primaryDisabled = activeTab === "security" ? !canChangePassword || isSavingPassword : !account || isSavingProfile;

  return (
    <main className="min-h-screen bg-[#eef3f8] px-4 py-6 text-slate-950 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="h-1.5 bg-gradient-to-r from-[#0A48FF] via-[#0A48FF] to-[#E31B23]" /><div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="h-10 rounded-xl bg-white">
              <Link to="/">
                <ArrowLeft className="size-4" />
                Quay lại LMS
              </Link>
            </Button>
            <div className="hidden h-10 w-px bg-slate-200 sm:block" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#E31B23]">ERG account</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">Hồ sơ và bảo mật</h1>
            </div>
          </div>
          <Button
            onClick={() => void primaryAction()}
            disabled={primaryDisabled}
            className="h-11 rounded-xl bg-[#06143A] px-5 text-white shadow-sm hover:bg-[#102257]"
          >
            {activeTab === "security" ? (
              isSavingPassword ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />
            ) : isSavingProfile ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {activeTab === "security" ? "Đổi mật khẩu" : "Lưu hồ sơ"}
          </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700">
            Đang đồng bộ hồ sơ mới nhất từ BE...
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <Avatar className="size-24 overflow-hidden rounded-lg border-4 border-white bg-blue-50 shadow-lg">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={form.fullName || "Avatar"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-2xl font-black text-[#0A48FF]">{initials}</div>
                    )}
                  </Avatar>
                  <button
                    aria-label="Upload avatar"
                    className="absolute -bottom-2 -right-2 grid size-10 place-items-center rounded-xl border-4 border-slate-50 bg-white text-[#0A48FF] shadow-md transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
                    type="button"
                    disabled={!account || isUploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {isUploadingAvatar ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                  </button>
                  <input
                    ref={avatarInputRef}
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = "";
                      openAvatarCropper(file);
                    }}
                  />
                </div>
                <div className="min-w-0 pt-1">
                  <h2 className="truncate text-xl font-black text-slate-950">{form.fullName || account?.email || "Tài khoản ERG"}</h2>
                  <p className="mt-1 truncate text-sm font-medium text-slate-500">{account?.email}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="size-3.5" />
                    {account?.status === "ACTIVE" ? "Đang hoạt động" : account?.status || "Chưa rõ"}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-white p-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Hoàn thiện hồ sơ</span>
                  <span>{completionPercent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#0A48FF] transition-all" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>
            </div>

            <nav className="mt-4 grid gap-2" aria-label="Cài đặt tài khoản">
              <ProfileTabButton active={activeTab === "profile"} icon={<UserRound className="size-4" />} onClick={() => setActiveTab("profile")} title="Thông tin hồ sơ" description="Tên, SĐT, avatar" />
              <ProfileTabButton active={activeTab === "security"} icon={<ShieldCheck className="size-4" />} onClick={() => setActiveTab("security")} title="Bảo mật" description="Đổi mật khẩu" />
            </nav>

            <div className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <ProfileLine icon={<BadgeCheck className="size-4" />} label="Vai trò" value={form.title || "Chưa cập nhật"} />
              <ProfileLine icon={<Building2 className="size-4" />} label="Bộ phận" value={form.department || "Chưa cập nhật"} />
              <ProfileLine icon={<Phone className="size-4" />} label="Điện thoại" value={form.phone || "Chưa cập nhật"} />
            </div>
          </aside>

          <section className="min-w-0">
            {activeTab === "profile" ? (
              <ProfileFormPanel form={form} notice={profileNotice} onSave={saveProfile} onUpdate={update} isSaving={isSavingProfile} account={account} />
            ) : (
              <SecurityPanel
                account={account}
                canChangePassword={canChangePassword}
                form={passwordForm}
                isSaving={isSavingPassword}
                notice={securityNotice}
                passwordScore={passwordScore}
                showPasswords={showPasswords}
                onChangePassword={changePassword}
                onTogglePasswords={() => setShowPasswords((value) => !value)}
                onUpdate={updatePasswordField}
              />
            )}
          </section>
        </div>
      </div>
      <AvatarCropDialog
        crop={avatarCrop}
        isUploading={isUploadingAvatar}
        onChange={setAvatarCrop}
        onClose={closeAvatarCropper}
        onPickAnother={() => avatarInputRef.current?.click()}
        onUpload={uploadCroppedAvatar}
      />
    </main>
  );
}

function ProfileFormPanel({ account, form, isSaving, notice, onSave, onUpdate }: {
  account: TeacherAccount | null;
  form: ProfileFormState;
  isSaving: boolean;
  notice: Notice | null;
  onSave: () => Promise<void>;
  onUpdate: (field: keyof ProfileFormState, value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <SectionHeader
        icon={<UserRound className="size-5" />}
        eyebrow="Thông tin cá nhân"
        title="Hồ sơ hiển thị trong LMS"
        description="Thông tin này dùng cho lời chào, phân quyền, danh sách thành viên và các luồng quản trị."
        action={
          <Button onClick={() => void onSave()} disabled={!account || isSaving} className="h-10 rounded-xl bg-[#0A48FF] px-4 text-white hover:bg-[#083bd1]">
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Lưu hồ sơ
          </Button>
        }
      />

      <NoticeBox notice={notice} />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field icon={<UserRound className="size-4" />} label="Họ và tên">
          <input className={inputClassName} value={form.fullName} onChange={(event) => onUpdate("fullName", event.target.value)} placeholder="Nhập họ và tên" />
        </Field>
        <Field icon={<Phone className="size-4" />} label="Số điện thoại">
          <input className={inputClassName} value={form.phone} onChange={(event) => onUpdate("phone", event.target.value)} placeholder="Nhập số điện thoại" />
        </Field>
        <Field icon={<Mail className="size-4" />} label="Email đăng nhập">
          <input className={mutedInputClassName} value={account?.email ?? ""} disabled readOnly />
        </Field>
        <Field icon={<Building2 className="size-4" />} label="Bộ phận">
          <input className={inputClassName} value={form.department} onChange={(event) => onUpdate("department", event.target.value)} placeholder="ERG / LMS / Trung tâm" />
        </Field>
        <Field icon={<BadgeCheck className="size-4" />} label="Chức danh">
          <input className={inputClassName} value={form.title} onChange={(event) => onUpdate("title", event.target.value)} placeholder="Giáo viên / Quản trị viên" />
        </Field>
        <Field icon={<UserRound className="size-4" />} label="Giới thiệu ngắn" className="md:col-span-2">
          <textarea className={textareaClassName} value={form.bio} onChange={(event) => onUpdate("bio", event.target.value)} placeholder="Một vài dòng giới thiệu về vai trò hoặc chuyên môn của bạn" />
        </Field>
      </div>
    </div>
  );
}

function SecurityPanel({
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
    <div className="grid gap-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
        <SectionHeader
          icon={<ShieldCheck className="size-5" />}
          eyebrow="Bảo mật tài khoản"
          title="Đổi mật khẩu đăng nhập"
          description="Mật khẩu mới được gửi thẳng tới BE và chỉ cho phép đổi mật khẩu của chính tài khoản đang đăng nhập."
          action={
            <Button onClick={() => void onChangePassword()} disabled={!canChangePassword || isSaving} className="h-10 rounded-xl bg-[#06143A] px-4 text-white hover:bg-[#102257]">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Đổi mật khẩu
            </Button>
          }
        />

        <NoticeBox notice={notice} />

        {!canChangePassword ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Tài khoản này đang dùng provider {account?.provider ?? "khác"}, nên chưa bật đổi mật khẩu local trên màn hình này.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field icon={<LockKeyhole className="size-4" />} label="Mật khẩu hiện tại" className="md:col-span-2">
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
          <Field icon={<KeyRound className="size-4" />} label="Mật khẩu mới">
            <input disabled={!canChangePassword} className={inputClassName} type={passwordType} value={form.nextPassword} onChange={(event) => onUpdate("nextPassword", event.target.value)} placeholder="Tối thiểu 8 ký tự" />
          </Field>
          <Field icon={<KeyRound className="size-4" />} label="Nhập lại mật khẩu mới">
            <input disabled={!canChangePassword} className={inputClassName} type={passwordType} value={form.confirmPassword} onChange={(event) => onUpdate("confirmPassword", event.target.value)} placeholder="Nhập lại mật khẩu mới" />
          </Field>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
            <span>Độ mạnh mật khẩu mới</span>
            <span>{passwordScoreLabel(passwordScore)}</span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className={`h-2 rounded-full ${index < passwordScore ? "bg-[#0A48FF]" : "bg-slate-200"}`} />
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Gợi ý: dùng tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt để giảm rủi ro bị đoán mật khẩu.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
        <SectionHeader
          icon={<CheckCircle2 className="size-5" />}
          eyebrow="Phiên đăng nhập"
          title="Thông tin xác thực hiện tại"
          description="Khu vực này giúp người dùng hiểu tài khoản đang đăng nhập bằng phương thức nào."
        />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <InfoTile label="Provider" value={account?.provider ?? "Không rõ"} />
          <InfoTile label="Trạng thái" value={account?.status ?? "Không rõ"} />
          <InfoTile label="Onboarding" value={account?.isProfileCompleted ? "Đã hoàn tất" : "Cần bổ sung"} />
        </div>
      </div>
    </div>
  );
}

export function AvatarCropDialog({ crop, isUploading, onChange, onClose, onPickAnother, onUpload }: {
  crop: AvatarCropState | null;
  isUploading: boolean;
  onChange: (crop: AvatarCropState | null | ((current: AvatarCropState | null) => AvatarCropState | null)) => void;
  onClose: () => void;
  onPickAnother: () => void;
  onUpload: () => Promise<void>;
}) {
  const geometry = crop?.image ? getAvatarGeometry(crop.image, crop.zoom, crop.offset, CROP_PREVIEW_SIZE) : null;

  const updateZoom = (value: number) => {
    onChange((current) => {
      if (!current) return current;
      const nextZoom = Number(value.toFixed(2));
      return {
        ...current,
        zoom: nextZoom,
        offset: current.image ? clampAvatarOffset(current.offset, current.image, nextZoom, CROP_PREVIEW_SIZE) : current.offset,
      };
    });
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!crop?.image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange((current) =>
      current
        ? {
            ...current,
            drag: {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              originX: current.offset.x,
              originY: current.offset.y,
            },
          }
        : current,
    );
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    onChange((current) => {
      if (!current?.drag || !current.image || current.drag.pointerId !== event.pointerId) return current;
      const offset = clampAvatarOffset(
        {
          x: current.drag.originX + event.clientX - current.drag.startX,
          y: current.drag.originY + event.clientY - current.drag.startY,
        },
        current.image,
        current.zoom,
        CROP_PREVIEW_SIZE,
      );
      return { ...current, offset };
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    onChange((current) => {
      if (!current?.drag || current.drag.pointerId !== event.pointerId) return current;
      return { ...current, drag: null };
    });
  };

  return (
    <Dialog open={Boolean(crop)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-[760px] gap-0 overflow-hidden rounded-lg p-0" showCloseButton={!isUploading}>
        <div className="h-1.5 bg-gradient-to-r from-[#0A48FF] to-[#E31B23]" />
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <DialogTitle className="text-xl font-black">Căn chỉnh ảnh đại diện</DialogTitle>
          <DialogDescription>Kéo ảnh để đặt khuôn mặt vào giữa khung, điều chỉnh zoom rồi lưu lên R2.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 p-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-4">
            <div
              className="relative grid select-none place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-950"
              style={{ width: CROP_PREVIEW_SIZE, height: CROP_PREVIEW_SIZE }}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              {crop ? (
                <img
                  src={crop.previewUrl}
                  alt="Avatar preview"
                  className="absolute max-w-none cursor-grab object-cover active:cursor-grabbing"
                  draggable={false}
                  style={
                    geometry
                      ? {
                          width: geometry.width,
                          height: geometry.height,
                          left: CROP_PREVIEW_SIZE / 2 + geometry.offset.x,
                          top: CROP_PREVIEW_SIZE / 2 + geometry.offset.y,
                          transform: "translate(-50%, -50%)",
                        }
                      : { maxWidth: "100%" }
                  }
                  onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
                    const image = event.currentTarget;
                    onChange((current) =>
                      current
                        ? {
                            ...current,
                            image: { width: image.naturalWidth, height: image.naturalHeight },
                            offset: { x: 0, y: 0 },
                          }
                        : current,
                    );
                  }}
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0_47%,rgba(15,23,42,0.72)_48%)]" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 size-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
            </div>
            <p className="text-center text-sm font-medium text-slate-500">Ảnh sau khi lưu sẽ được crop vuông 512px và BE tối ưu lại trước khi đưa lên R2.</p>
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Preview</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">Hiển thị trong LMS</p>
                </div>
                <div className="size-20 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                  {crop ? (
                    <div className="relative h-full w-full overflow-hidden rounded-full bg-slate-100">
                      <img
                        src={crop.previewUrl}
                        alt="Avatar round preview"
                        className="absolute max-w-none"
                        draggable={false}
                        style={
                          geometry
                            ? {
                                width: geometry.width / 4,
                                height: geometry.height / 4,
                                left: 40 + geometry.offset.x / 4,
                                top: 40 + geometry.offset.y / 4,
                                transform: "translate(-50%, -50%)",
                              }
                            : { width: "100%", height: "100%", objectFit: "cover" }
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                <span>Zoom</span>
                <span>{Math.round((crop?.zoom ?? 1) * 100)}%</span>
              </div>
              <input
                className="mt-3 h-2 w-full accent-[#0A48FF]"
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={crop?.zoom ?? 1}
                onChange={(event) => updateZoom(Number(event.target.value))}
              />
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={() => updateZoom(1)} disabled={isUploading}>
                  Reset
                </Button>
                <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onPickAnother} disabled={isUploading}>
                  <Upload className="size-4" />
                  Chọn ảnh khác
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-800">
              Đường dẫn R2 sau khi lưu: <span className="font-black">avatar/{"{userID}"}/...</span>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button type="button" variant="outline" className="rounded-lg" onClick={onClose} disabled={isUploading}>
            Hủy
          </Button>
          <Button type="button" className="rounded-lg bg-[#06143A] text-white hover:bg-[#102257]" onClick={() => void onUpload()} disabled={!crop?.image || isUploading}>
            {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Lưu avatar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function SectionHeader({ action, description, eyebrow, icon, title }: { action?: ReactNode; description: string; eyebrow: string; icon: ReactNode; title: string }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
      <div className="flex gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0A48FF]">{icon}</div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#E31B23]">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function Field({ children, className, icon, label }: { children: ReactNode; className?: string; icon: ReactNode; label: string }) {
  return (
    <label className={className}>
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function PasswordInput({ disabled, onChange, onToggle, placeholder, show, type, value }: {
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  placeholder: string;
  show: boolean;
  type: "password" | "text";
  value: string;
}) {
  return (
    <div className="relative">
      <input disabled={disabled} className={`${inputClassName} pr-12`} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      <button
        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        type="button"
        onClick={onToggle}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function ProfileTabButton({ active, description, icon, onClick, title }: { active: boolean; description: string; icon: ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
        active ? "border-[#0A48FF] bg-blue-50 text-[#0A48FF] shadow-sm" : "border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50"
      }`}
      type="button"
      onClick={onClick}
    >
      <span className={`grid size-9 place-items-center rounded-xl ${active ? "bg-white" : "bg-slate-50"}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{title}</span>
        <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">{description}</span>
      </span>
    </button>
  );
}

function NoticeBox({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return (
    <div
      className={
        notice.tone === "success"
          ? "mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
          : "mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
      }
    >
      {notice.message}
    </div>
  );
}

function ProfileLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-[#0A48FF]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
        <p className="truncate text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function toForm(account: TeacherAccount | null): ProfileFormState {
  return {
    fullName: account?.fullName ?? emptyForm.fullName,
    phone: account?.phone ?? emptyForm.phone,
    department: account?.department ?? emptyForm.department,
    title: account?.title ?? emptyForm.title,
    avatarUrl: account?.avatarUrl ?? emptyForm.avatarUrl,
    bio: account?.bio ?? emptyForm.bio,
  };
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts.at(0)?.charAt(0) ?? "E";
  const last = parts.length > 1 ? parts.at(-1)?.charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}

function getPasswordScore(value: string) {
  if (!value) return 0;
  const checks = [value.length >= 8, /[A-Z]/.test(value), /[a-z]/.test(value) && /\d/.test(value), /[^A-Za-z0-9]/.test(value)];
  return checks.filter(Boolean).length;
}

function passwordScoreLabel(score: number) {
  if (score >= 4) return "Mạnh";
  if (score >= 3) return "Khá";
  if (score >= 2) return "Trung bình";
  if (score >= 1) return "Yếu";
  return "Chưa nhập";
}

function getAvatarGeometry(image: { width: number; height: number }, zoom: number, offset: { x: number; y: number }, cropSize: number) {
  const baseScale = cropSize / Math.min(image.width, image.height);
  const scale = baseScale * zoom;
  return {
    width: image.width * scale,
    height: image.height * scale,
    offset: clampAvatarOffset(offset, image, zoom, cropSize),
  };
}

function clampAvatarOffset(offset: { x: number; y: number }, image: { width: number; height: number }, zoom: number, cropSize: number) {
  const baseScale = cropSize / Math.min(image.width, image.height);
  const width = image.width * baseScale * zoom;
  const height = image.height * baseScale * zoom;
  const maxX = Math.max(0, (width - cropSize) / 2);
  const maxY = Math.max(0, (height - cropSize) / 2);
  return {
    x: clamp(offset.x, -maxX, maxX),
    y: clamp(offset.y, -maxY, maxY),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function createCroppedAvatarFile(crop: AvatarCropState) {
  if (!crop.image) throw new Error("Ảnh chưa sẵn sàng để crop.");
  const image = await loadImage(crop.previewUrl);
  const geometry = getAvatarGeometry({ width: image.naturalWidth, height: image.naturalHeight }, crop.zoom, crop.offset, CROP_PREVIEW_SIZE);
  const canvas = document.createElement("canvas");
  canvas.width = CROP_OUTPUT_SIZE;
  canvas.height = CROP_OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE);
  const factor = CROP_OUTPUT_SIZE / CROP_PREVIEW_SIZE;
  const dx = (CROP_PREVIEW_SIZE / 2 - geometry.width / 2 + geometry.offset.x) * factor;
  const dy = (CROP_PREVIEW_SIZE / 2 - geometry.height / 2 + geometry.offset.y) * factor;
  ctx.drawImage(image, dx, dy, geometry.width * factor, geometry.height * factor);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Không thể tạo file avatar."));
    }, "image/jpeg", 0.9);
  });
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không thể đọc ảnh avatar."));
    image.src = src;
  });
}
