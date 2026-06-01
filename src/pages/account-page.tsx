import { useNavigate } from "react-router-dom";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/dashboard-kit";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";

export function AccountPage() {
  const auth = useAuthSession("lms");
  const navigate = useNavigate();
  const account = auth.account;

  function signOut() {
    auth.actions.signOut();
    logoutAccount();
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <Avatar className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-[#0b1f80] text-lg font-black text-white">
              {account?.avatarUrl ? <img src={account.avatarUrl} alt={account.fullName} className="h-full w-full object-cover" /> : initials(account?.fullName ?? "ERG")}
            </Avatar>
            <div>
              <h1 className="text-2xl font-black">Quản lý tài khoản</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">{account?.email ?? "Chưa có phiên đăng nhập"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/account/login-logs")}>Lịch sử đăng nhập</Button>
            <Button variant="danger" onClick={signOut}>Đăng xuất</Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Họ tên" value={account?.fullName} />
          <Field label="Email" value={account?.email} />
          <Field label="Vai trò" value={account?.title ?? account?.role} />
          <Field label="Phòng ban" value={account?.department} />
          <Field label="Số điện thoại" value={account?.phone} />
          <Field label="Trạng thái" value={account?.status ?? "ACTIVE"} />
        </div>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-black uppercase text-slate-400">{label}</div>
      <div className="mt-1 font-bold text-slate-900">{value || "-"}</div>
    </div>
  );
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase();
}
