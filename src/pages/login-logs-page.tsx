import { useNavigate } from "@/routes/router-compat";

import { LmsLoginLogsPage } from "@/features/lms/components/lms-login-logs-page";

export function LoginLogsPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <LmsLoginLogsPage onManageAccount={() => navigate("/account")} />
    </main>
  );
}
