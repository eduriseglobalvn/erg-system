import { useNavigate } from "@/routes/router-compat";

import { LmsAccountPage } from "@/features/lms/components/lms-account-page";

export function AccountPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <LmsAccountPage
        onLoginLogs={() => navigate("/account/login-logs")}
        onSignedOut={() => navigate("/login", { replace: true })}
      />
    </main>
  );
}
