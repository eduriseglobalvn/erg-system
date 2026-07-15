import Avatar from "@mui/material/Avatar";
import {
  HelpIcon,
  MoreHorizontalIcon,
  SearchIcon,
  SettingsIcon,
} from "@/layouts/dashboard/components/dashboard-icons";
import { getCurrentAccount } from "@/platform/auth";
import { useI18n } from "@/platform/i18n";

export function DashboardAccountCard() {
  const { t } = useI18n();
  const account = getCurrentAccount();

  const displayName = account?.fullName ?? "Nguyen Ngoc Anh";
  const displayEmail = account?.email ?? "ngocanh@erg.vn";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="space-y-1 pb-4">
        {[
          { label: t("common.settings"), icon: <SettingsIcon /> },
          { label: t("dashboard.getHelp"), icon: <HelpIcon /> },
          { label: t("common.search"), icon: <SearchIcon /> },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] font-medium text-slate-950 transition hover:bg-slate-100"
          >
            <span className="text-slate-700">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-slate-100">
        <Avatar
          src={account?.avatarUrl}
          alt={displayName}
          variant="rounded"
          className="size-11"
          sx={{ width: 44, height: 44, bgcolor: "var(--erg-blue)", fontSize: "0.75rem", fontWeight: 600, color: "#fff" }}
        >
          {initials}
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-slate-950">{displayName}</div>
          <div className="truncate text-sm text-slate-500">{displayEmail}</div>
        </div>
        <div className="text-slate-500">
          <MoreHorizontalIcon />
        </div>
      </div>
    </div>
  );
}
