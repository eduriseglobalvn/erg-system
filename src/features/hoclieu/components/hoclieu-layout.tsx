"use client";

import { useEffect, useMemo, useState, type ImgHTMLAttributes, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  School,
  UserCircle,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ERG_ASSETS } from "@/config/seo";
import { classroomSchools } from "@/features/classroom/api/mock-classroom-data";
import { listManageableUnits } from "@/features/dashboard/api/lms-dashboard-api";
import { TeacherAuthDialog } from "@/features/auth/components/teacher-auth-dialog";
import { logoutAccount } from "@/features/auth/api/auth-storage";
import { logoutStudentSession } from "@/features/auth/api/student-auth-storage";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { buildRedirectPath } from "@/features/auth/utils/auth-redirects";
import {
  COURSE_GROUPS,
  FLAT_PROGRAMS,
  QUICK_ACCESS_NAV,
  TOTAL_LESSON_SHELVES,
  type CourseColor,
  type QuickAccessItem,
} from "@/features/hoclieu/api/hoclieu-data";
import { HocLieuLink as Link } from "@/features/hoclieu/components/hoclieu-link";
import { getCurrentAcademicYear } from "@/features/hoclieu/api/teacher-dashboard-api";
import { HocLieuDashboardScopeProvider } from "@/features/hoclieu/hooks/use-hoclieu-dashboard-scope";
import { AUTH_SESSION_INVALID_EVENT, AUTH_SESSION_REPLACED_EVENT } from "@/lib/api-client";

const quickNavItems = QUICK_ACCESS_NAV.filter((item) => item.href !== "/chuong-trinh");

const textLabels: Record<string, string> = {
  "Chuong trinh": "ChÆ°Æ¡ng trÃ¬nh",
  "Kho hoc lieu": "Kho há»c liá»‡u",
  Portfolio: "Portfolio",
  "Quiz bank": "Quiz bank",
  "Cong dong": "Cá»™ng Ä‘á»“ng",
  "Tieng Anh va hoc lieu SGK": "Tiáº¿ng Anh vÃ  há»c liá»‡u SGK",
  "Tin hoc va chung chi": "Tin há»c vÃ  chá»©ng chá»‰",
  "Hoc lieu mo rong": "Há»c liá»‡u má»Ÿ rá»™ng",
  "Sach mem 2.0": "SÃ¡ch má»m 2.0",
  "Hop phan bo tro": "Há»£p pháº§n bá»• trá»£",
  "Video minh hoa": "Video minh há»a",
  "Tin hoc pho thong": "Tin há»c phá»• thÃ´ng",
  "Project file": "Project file",
  "Giao duc STEM": "GiÃ¡o dá»¥c STEM",
  "Ke hoach day hoc": "Káº¿ hoáº¡ch dáº¡y há»c",
  "Bai giang dien tu": "BÃ i giáº£ng Ä‘iá»‡n tá»­",
  "Phieu hoc tap": "Phiáº¿u há»c táº­p",
  "Kho tai nguyen sat giao trinh, phu hop cho giao vien day tren lop moi ngay.":
    "Kho tÃ i nguyÃªn sÃ¡t giÃ¡o trÃ¬nh, phÃ¹ há»£p cho giÃ¡o viÃªn dáº¡y trÃªn lá»›p má»—i ngÃ y.",
  "Nhom chuong trinh day hoc co tinh he thong, phuc vu ca day chinh khoa va luyen thi chung chi.":
    "NhÃ³m chÆ°Æ¡ng trÃ¬nh dáº¡y há»c cÃ³ tÃ­nh há»‡ thá»‘ng, phá»¥c vá»¥ cáº£ dáº¡y chÃ­nh khÃ³a vÃ  luyá»‡n thi chá»©ng chá»‰.",
  "Nhom tai nguyen diem nhan de day du an, STEM va cac tiet hoc can nhieu vat lieu minh hoa.":
    "NhÃ³m tÃ i nguyÃªn dÃ nh cho dáº¡y dá»± Ã¡n, STEM vÃ  cÃ¡c tiáº¿t há»c cáº§n nhiá»u váº­t liá»‡u minh há»a.",
  "Danh muc chuong trinh va bo lesson kit": "Danh má»¥c chÆ°Æ¡ng trÃ¬nh vÃ  bá»™ lesson kit",
  "Thu vien tai nguyen theo lop, mon va dinh dang file": "ThÆ° viá»‡n tÃ i nguyÃªn theo lá»›p, mÃ´n vÃ  Ä‘á»‹nh dáº¡ng file",
  "Bai giang mau va template da duoc su dung": "BÃ i giáº£ng máº«u vÃ  template Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng",
  "Warm-up quiz, mock quiz va bai danh gia nhanh": "Warm-up quiz, mock quiz vÃ  bÃ i Ä‘Ã¡nh giÃ¡ nhanh",
  "Kenh trao doi va mentor review noi bo": "KÃªnh trao Ä‘á»•i vÃ  mentor review ná»™i bá»™",
};

const programSummaries: Record<string, string> = {
  "global-success": "SÃ¡ch má»m, há»£p pháº§n bá»• trá»£, video minh há»a vÃ  tÃ i nguyÃªn classroom-ready cho giÃ¡o viÃªn Tiáº¿ng Anh.",
  "ic3-gs6": "Lesson kit, practice pack vÃ  mock quiz cho Computing Fundamentals, Key Applications vÃ  Living Online.",
  mos: "TÃ i nguyÃªn Word, Excel, PowerPoint theo objective, cÃ³ bÃ i giáº£ng, file thao tÃ¡c vÃ  bÃ i Ä‘Ã¡nh giÃ¡.",
  "tin-hoc": "Scratch, Python vÃ  há»c liá»‡u thá»±c hÃ nh cÃ³ cáº¥u trÃºc, phÃ¹ há»£p cho dáº¡y há»c trÃªn lá»›p vÃ  CLB.",
  stem: "Káº¿ hoáº¡ch dáº¡y há»c, bÃ i giáº£ng Ä‘iá»‡n tá»­, phiáº¿u há»c táº­p vÃ  sáº£n pháº©m máº«u cho tiáº¿t há»c STEM.",
};

function normalizeVietnameseText(value: string) {
  const normalizedMap: Record<string, string> = {
    "ChÆ°Æ¡ng trÃ¬nh": "Chương trình",
    "Kho há»c liá»‡u": "Kho học liệu",
    "Cá»™ng Ä‘á»“ng": "Cộng đồng",
    "Tiáº¿ng Anh vÃ  há»c liá»‡u SGK": "Tiếng Anh và học liệu SGK",
    "Tin há»c vÃ  chá»©ng chá»‰": "Tin học và chứng chỉ",
    "Há»c liá»‡u má»Ÿ rá»™ng": "Học liệu mở rộng",
    "SÃ¡ch má»m 2.0": "Sách mềm 2.0",
    "Há»£p pháº§n bá»• trá»£": "Hợp phần bổ trợ",
    "Video minh há»a": "Video minh họa",
    "Tin há»c phá»• thÃ´ng": "Tin học phổ thông",
    "GiÃ¡o dá»¥c STEM": "Giáo dục STEM",
    "Káº¿ hoáº¡ch dáº¡y há»c": "Kế hoạch dạy học",
    "BÃ i giáº£ng Ä‘iá»‡n tá»­": "Bài giảng điện tử",
    "Phiáº¿u há»c táº­p": "Phiếu học tập",
    "Kho tÃ i nguyÃªn sÃ¡t giÃ¡o trÃ¬nh, phÃ¹ há»£p cho giÃ¡o viÃªn dáº¡y trÃªn lá»›p má»—i ngÃ y.": "Kho tài nguyên sát giáo trình, phù hợp cho giáo viên dạy trên lớp mỗi ngày.",
    "NhÃ³m chÆ°Æ¡ng trÃ¬nh dáº¡y há»c cÃ³ tÃ­nh há»‡ thá»‘ng, phá»¥c vá»¥ cáº£ dáº¡y chÃ­nh khÃ³a vÃ  luyá»‡n thi chá»©ng chá»‰.": "Nhóm chương trình dạy học có tính hệ thống, phục vụ cả dạy chính khóa và luyện thi chứng chỉ.",
    "NhÃ³m tÃ i nguyÃªn dÃ nh cho dáº¡y dá»± Ã¡n, STEM vÃ  cÃ¡c tiáº¿t há»c cáº§n nhiá»u váº­t liá»‡u minh há»a.": "Nhóm tài nguyên dành cho dạy dự án, STEM và các tiết học cần nhiều vật liệu minh họa.",
    "Danh má»¥c chÆ°Æ¡ng trÃ¬nh vÃ  bá»™ lesson kit": "Danh mục chương trình và bộ lesson kit",
    "ThÆ° viá»‡n tÃ i nguyÃªn theo lá»›p, mÃ´n vÃ  Ä‘á»‹nh dáº¡ng file": "Thư viện tài nguyên theo lớp, môn và định dạng file",
    "BÃ i giáº£ng máº«u vÃ  template Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng": "Bài giảng mẫu và template đã được sử dụng",
    "Warm-up quiz, mock quiz vÃ  bÃ i Ä‘Ã¡nh giÃ¡ nhanh": "Warm-up quiz, mock quiz và bài đánh giá nhanh",
    "KÃªnh trao Ä‘á»•i vÃ  mentor review ná»™i bá»™": "Kênh trao đổi và mentor review nội bộ",
    "SÃ¡ch má»m, há»£p pháº§n bá»• trá»£, video minh há»a vÃ  tÃ i nguyÃªn classroom-ready cho giÃ¡o viÃªn Tiáº¿ng Anh.": "Sách mềm, hợp phần bổ trợ, video minh họa và tài nguyên classroom-ready cho giáo viên Tiếng Anh.",
    "Lesson kit, practice pack vÃ  mock quiz cho Computing Fundamentals, Key Applications vÃ  Living Online.": "Lesson kit, practice pack và mock quiz cho Computing Fundamentals, Key Applications và Living Online.",
    "TÃ i nguyÃªn Word, Excel, PowerPoint theo objective, cÃ³ bÃ i giáº£ng, file thao tÃ¡c vÃ  bÃ i Ä‘Ã¡nh giÃ¡.": "Tài nguyên Word, Excel, PowerPoint theo objective, có bài giảng, file thao tác và bài đánh giá.",
    "Scratch, Python vÃ  há»c liá»‡u thá»±c hÃ nh cÃ³ cáº¥u trÃºc, phÃ¹ há»£p cho dáº¡y há»c trÃªn lá»›p vÃ  CLB.": "Scratch, Python và học liệu thực hành có cấu trúc, phù hợp cho dạy học trên lớp và CLB.",
    "Káº¿ hoáº¡ch dáº¡y há»c, bÃ i giáº£ng Ä‘iá»‡n tá»­, phiáº¿u há»c táº­p vÃ  sáº£n pháº©m máº«u cho tiáº¿t há»c STEM.": "Kế hoạch dạy học, bài giảng điện tử, phiếu học tập và sản phẩm mẫu cho tiết học STEM.",
  };

  return normalizedMap[value] ?? value;
}

type ManagedSchoolOption = {
  id: string;
  name: string;
  principal: string;
};

function label(value: string) {
  return normalizeVietnameseText(textLabels[value] ?? value);
}

function summaryLabel(value: string) {
  return normalizeVietnameseText(value);
}

function getAccentClass(color: CourseColor) {
  switch (color) {
    case "blue":
      return "from-[#00008b] to-blue-500";
    case "red":
      return "from-[#cc0022] to-rose-500";
    case "indigo":
      return "from-indigo-700 to-indigo-400";
    case "emerald":
      return "from-emerald-600 to-teal-400";
    default:
      return "from-slate-700 to-slate-400";
  }
}

function getColorClass(color: CourseColor) {
  switch (color) {
    case "blue":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "red":
      return "bg-red-50 text-red-700 border-red-100";
    case "indigo":
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    case "emerald":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
}

function HeaderImage({ alt, priority, ...props }: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) {
  void priority;
  return <img alt={alt ?? ""} {...props} />;
}

function ProgramMegaMenu() {
  return (
    <div className="invisible absolute left-1/2 top-full z-40 mt-0 w-[min(92vw,980px)] origin-top -translate-x-1/2 -translate-y-2 scale-[0.98] overflow-hidden rounded-lg border border-[var(--erg-border)] bg-white opacity-0 shadow-[var(--erg-shadow-lg)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100">
      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="bg-[linear-gradient(155deg,var(--erg-blue)_0%,#172554_72%,var(--erg-red)_150%)] p-7 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">CÃ¡c chÆ°Æ¡ng trÃ¬nh trong há»‡ thá»‘ng</p>
          <h3 className="mt-4 text-2xl font-black leading-tight">Chá»n Ä‘Ãºng chÆ°Æ¡ng trÃ¬nh trÆ°á»›c khi vÃ o há»c liá»‡u.</h3>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Menu nÃ y chá»‰ hiá»ƒn thá»‹ cÃ¡c chÆ°Æ¡ng trÃ¬nh hiá»‡n cÃ³ trÃªn portal ERG, Ä‘á»“ng bá»™ vá»›i trang ChÆ°Æ¡ng trÃ¬nh vÃ  Kho há»c liá»‡u.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">ChÆ°Æ¡ng trÃ¬nh</p>
              <p className="mt-2 text-3xl font-black">{FLAT_PROGRAMS.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">Há»c liá»‡u</p>
              <p className="mt-2 text-3xl font-black">{TOTAL_LESSON_SHELVES}+</p>
            </div>
          </div>

          <Link
            href="/chuong-trinh"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--erg-blue)] transition hover:translate-x-1"
          >
            Xem táº¥t cáº£ chÆ°Æ¡ng trÃ¬nh
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="max-h-[74vh] overflow-y-auto overscroll-contain p-5">
          <div className="grid gap-5">
            {COURSE_GROUPS.map((group) => (
              <section key={group.title} className="rounded-lg border border-[var(--erg-border)] bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/70 pb-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{label(group.title)}</p>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">{label(group.description)}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {group.programs.length} chÆ°Æ¡ng trÃ¬nh
                  </span>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  {group.programs.map((program) => {
                    const ProgramIcon = program.items[0]?.icon || BookOpen;

                    return (
                      <Link
                        key={program.slug}
                        href={program.href}
                        className="group/program rounded-lg border border-[var(--erg-border)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[var(--erg-blue)]/25 hover:shadow-[var(--erg-shadow)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm ${getAccentClass(program.color)}`}>
                            <ProgramIcon className="h-5 w-5" />
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${getColorClass(program.color)}`}>
                            {program.badge}
                          </span>
                        </div>
                        <h3 className="mt-4 text-[15px] font-black tracking-tight text-slate-900 transition-colors group-hover/program:text-[#00008b]">
                          {label(program.name)}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{summaryLabel(programSummaries[program.slug] ?? label(program.summary))}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {program.items.slice(0, 3).map((item) => (
                            <span
                              key={item.name}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
                            >
                              {label(item.name)}
                            </span>
                          ))}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileNavItem({ item, onClick }: { item: QuickAccessItem; onClick: () => void }) {
  const ItemIcon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-[#00008b]">
          <ItemIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{label(item.label)}</p>
          <p className="text-xs text-slate-500">{label(item.description)}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </Link>
  );
}

function useManagedSchools() {
  const fallbackSchools = useMemo<ManagedSchoolOption[]>(
    () =>
      classroomSchools.map((school) => ({
        id: school.id,
        name: school.name,
        principal: school.principal,
      })),
    [],
  );

  const schoolsQuery = useQuery({
    queryKey: ["hoclieu", "managed-schools"],
    queryFn: async () => {
      const unitsResult = await listManageableUnits();

      const nextSchools = unitsResult
        .filter((unit) => unit.type === "school")
        .map((unit) => ({
          id: unit.id,
          name: unit.name,
          principal: unit.description?.trim() || "Đang cập nhật",
        }));

      return nextSchools.length ? nextSchools : fallbackSchools;
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });

  return schoolsQuery.data ?? [];
}

function ManagedSchoolSwitcher({
  selectedSchoolId,
  onSelectSchool,
  schools,
  compact = false,
}: {
  selectedSchoolId: string;
  onSelectSchool: (schoolId: string) => void;
  schools: ManagedSchoolOption[];
  compact?: boolean;
}) {
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? schools[0];

  if (!selectedSchool) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Chọn trường quản lý"
          className={`flex items-center gap-3 rounded-full border border-slate-200 bg-white text-left hover:bg-slate-50 ${
            compact ? "h-10 px-3" : "h-11 px-4"
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#00008b]">
            <School className="h-4 w-4" />
          </div>
          <div className={`min-w-0 ${compact ? "hidden xl:block" : ""}`}>
            <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Trường quản lý</p>
            <p className="truncate text-sm font-bold text-slate-700">{selectedSchool.name}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm">
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Danh sách trường</p>
            <p className="mt-2 text-sm font-bold text-slate-700">Danh sách trường mà tài khoản hiện tại được phân quyền truy cập.</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={selectedSchoolId} onValueChange={onSelectSchool}>
          {schools.map((school) => (
            <DropdownMenuRadioItem key={school.id} value={school.id} className="cursor-pointer rounded-xl px-3 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#00008b]">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{school.name}</p>
                  <p className="truncate text-xs text-slate-500">Phụ trách: {school.principal}</p>
                </div>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderSearchButton({ compact = false }: { compact?: boolean }) {
  function handleClick() {
    window.dispatchEvent(new CustomEvent("hoclieu-dashboard-focus-search"));
  }

  return (
    <button
      type="button"
      aria-label="Tìm kiếm"
      onClick={handleClick}
      className={
        compact
          ? "flex h-10 w-10 items-center justify-center rounded-full text-[var(--erg-blue)] hover:bg-slate-100"
          : "hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#00008b] hover:bg-slate-100 xl:flex"
      }
    >
      <Search className="h-5 w-5" />
    </button>
  );
}

function HocLieuUserMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuthSession();
  const account = auth.account;

  const displayName = account?.fullName?.trim() || "Giáo viên ERG";
  const displayEmail = account?.email?.trim() || "teacher@erg.edu.vn";
  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item[0])
        .join("")
        .toUpperCase() || "ERG",
    [displayName],
  );

  function openProfile(tab: "profile" | "security") {
    navigate(`/profile?tab=${tab}`);
  }

  function signOut() {
    auth.actions.signOut();
    logoutStudentSession();
    navigate("/login", { replace: true });
  }

  if (!account) {
    const redirect = buildRedirectPath(location.pathname, location.search, location.hash);
    return (
      <button
        type="button"
        onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`)}
        className="flex h-10 items-center rounded-full border border-[var(--erg-blue)]/20 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[var(--erg-blue)] hover:bg-blue-50"
      >
        Đăng nhập
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Mở menu tài khoản"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-left hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
        >
          <Avatar className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
            <AvatarImage src={account.avatarUrl || ""} alt={displayName} />
            <AvatarFallback className="rounded-full bg-[var(--erg-blue)] text-[10px] font-black text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-72 rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm">
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <Avatar className="h-12 w-12 overflow-hidden rounded-xl border border-white shadow-sm">
              <AvatarImage src={account.avatarUrl || ""} alt={displayName} />
              <AvatarFallback className="rounded-xl bg-[var(--erg-blue)] text-xs font-black text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">{displayName}</p>
              <p className="truncate text-xs font-medium text-slate-500">{displayEmail}</p>
              <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                Online
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openProfile("profile")} className="cursor-pointer gap-2 rounded-lg px-2.5 py-2">
          <UserCircle className="h-4 w-4" />
          Thông tin tài khoản
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openProfile("security")} className="cursor-pointer gap-2 rounded-lg px-2.5 py-2">
          <KeyRound className="h-4 w-4" />
          Đổi mật khẩu
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={signOut}
          variant="destructive"
          className="cursor-pointer gap-2 rounded-lg px-2.5 py-2"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M14 8.25V6.6c0-.82.2-1.35 1.35-1.35H17V2.4A22.8 22.8 0 0 0 14.6 2C12.23 2 10.6 3.45 10.6 6.1v2.15H8v3.2h2.6V22H14V11.45h2.65l.4-3.2H14Z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <rect x="3" y="6.5" width="18" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="m10.5 9.5 4.5 2.5-4.5 2.5v-5Z" fill="currentColor" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.8" cy="7.2" r="1" fill="currentColor" />
    </svg>
  );
}

function HocLieuPageLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const managedSchools = useManagedSchools();
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const isLibraryPath = pathname === "/kho-hoc-lieu" || pathname.startsWith("/kho-hoc-lieu/");
  const usesHocLieuShell = isLibraryPath;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }, [pathname]);

  useEffect(() => {
    if (!managedSchools.length) return;
    setSelectedSchoolId((current) => (managedSchools.some((school) => school.id === current) ? current : managedSchools[0].id));
  }, [managedSchools]);

  useEffect(() => {
    function redirectToLogin() {
      logoutAccount();
      logoutStudentSession();

      if (location.pathname === "/login") return;

      const redirect = buildRedirectPath(location.pathname, location.search, location.hash);
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
    }

    window.addEventListener(AUTH_SESSION_INVALID_EVENT, redirectToLogin);
    window.addEventListener(AUTH_SESSION_REPLACED_EVENT, redirectToLogin);

    return () => {
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, redirectToLogin);
      window.removeEventListener(AUTH_SESSION_REPLACED_EVENT, redirectToLogin);
    };
  }, [location.hash, location.pathname, location.search, navigate]);

  const dashboardScope = useMemo(
    () => ({
      selectedSchoolId,
      academicYear: getCurrentAcademicYear(),
    }),
    [selectedSchoolId],
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      {usesHocLieuShell ? (
        <nav className="sticky top-0 z-[100] border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <HeaderImage src={ERG_ASSETS.logo} alt="ERG" width={96} height={42} className="h-10 w-auto object-contain" />
              <span className="hidden border-l border-slate-200 pl-3 text-lg font-black tracking-tight text-[var(--erg-blue)] sm:inline">
                Học liệu ERG
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <HeaderSearchButton compact />
              <ManagedSchoolSwitcher schools={managedSchools} selectedSchoolId={selectedSchoolId} onSelectSchool={setSelectedSchoolId} compact />
              <button type="button" aria-label="Thông báo" className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--erg-red)] hover:bg-slate-100">
                <Bell className="h-5 w-5" />
              </button>
              <HocLieuUserMenu />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#00008b] lg:hidden"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          <div
            className={`border-t border-slate-100 bg-white px-4 py-3 lg:hidden ${
              isMobileMenuOpen ? "block" : "hidden"
            }`}
          >
            <div className="grid gap-2">
              {["Kho học liệu", "Lớp học", "LMS", "OLTM", "HL Ngoại ngữ", "HL Sách lái"].map((item) => (
                <Link
                  key={item}
                  href="/kho-hoc-lieu/1"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[var(--erg-blue)]"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      ) : (
      <nav className="sticky top-0 z-[100] border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[92rem] px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4 md:h-24 xl:gap-6 2xl:gap-8">
            <div className="flex min-w-0 shrink-0 items-center gap-4 xl:flex-none">
              <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform duration-300">
                <HeaderImage
                  src={ERG_ASSETS.logo}
                  alt="ERG logo"
                  width={110}
                  height={60}
                  className="w-[90px] object-contain md:w-[100px]"
                  priority
                />
                <div className="flex min-w-0 flex-col">
                  <h2 className="whitespace-nowrap text-base font-black uppercase leading-none tracking-tight text-[#00008b] md:text-lg">
                    Teacher <span className="text-[#cc0022]">Hub</span>
                  </h2>
                  <p className="mt-1 hidden text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400 md:text-[9px] xl:block">
                    hoclieu.erg.edu.vn
                  </p>
                </div>
              </Link>
            </div>

            <div className="hidden xl:flex xl:min-w-0 xl:flex-1 xl:items-center xl:justify-center xl:pl-6 2xl:pl-8">
              <div className="flex min-w-0 items-center justify-center gap-6 2xl:gap-8">
                <div className="group relative flex h-full shrink-0 items-center justify-center">
                  <Link
                    href="/chuong-trinh"
                    className="relative flex items-center gap-2 whitespace-nowrap py-4 text-[15px] font-black uppercase tracking-[0.04em] text-[#00008b] transition-all duration-300 hover:text-[#cc0022] group-hover:text-[#cc0022] 2xl:text-[16px] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-[#cc0022] after:transition-all after:duration-300 group-hover:after:w-full"
                  >
                    ChÆ°Æ¡ng trÃ¬nh
                    <ChevronDown className="h-3.5 w-3.5 text-slate-300 transition-transform duration-300 group-hover:rotate-180 group-hover:text-[#cc0022]" strokeWidth={3} />
                  </Link>
                  <ProgramMegaMenu />
                </div>

                <div className="flex min-w-0 items-center gap-6 2xl:gap-8">
                  {quickNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`relative inline-flex shrink-0 items-center justify-center whitespace-nowrap py-4 text-[15px] font-black uppercase tracking-[0.04em] transition-colors hover:text-[#cc0022] 2xl:text-[16px] ${
                          isActive ? "text-[#cc0022]" : "text-[#00008b]"
                        }`}
                      >
                        {label(item.label)}
                        <span className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 bg-[#cc0022] transition-all ${isActive ? "w-[72%]" : "w-0"}`} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 xl:flex-none 2xl:gap-4">
              <HeaderSearchButton />
              <div className="hidden xl:block">
                <ManagedSchoolSwitcher schools={managedSchools} selectedSchoolId={selectedSchoolId} onSelectSchool={setSelectedSchoolId} />
              </div>
              <button
                type="button"
                aria-label="Thông báo"
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#00008b] transition-all hover:bg-slate-100 active:scale-90 xl:flex"
              >
                <Bell className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <HocLieuUserMenu />
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-[#00008b] shadow-sm active:scale-95 xl:hidden"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-7 w-7" strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`fixed inset-0 top-20 z-[90] bg-white/95 backdrop-blur-xl transition-all duration-300 xl:hidden ${
            isMobileMenuOpen ? "translate-x-0 opacity-100" : "pointer-events-none hidden translate-x-full opacity-0"
          }`}
        >
          <div className="max-h-[calc(100vh-80px)] space-y-8 overflow-y-auto p-6">
            <div className="rounded-[28px] bg-[linear-gradient(145deg,#00008b_0%,#1d4ed8_50%,#0f172a_100%)] p-5 text-white shadow-2xl shadow-blue-200/40">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">Teacher Hub</p>
              <h3 className="mt-3 text-2xl font-black leading-tight">Menu ERG cho kho há»c liá»‡u giÃ¡o viÃªn.</h3>
              <p className="mt-3 text-sm leading-6 text-white/80">Chá»n chÆ°Æ¡ng trÃ¬nh, kho há»c liá»‡u, portfolio, quiz bank vÃ  cá»™ng Ä‘á»“ng tá»« cÃ¹ng má»™t menu.</p>
            </div>

            <div className="space-y-3">
              {QUICK_ACCESS_NAV.map((item) => (
                <MobileNavItem key={item.label} item={item} onClick={() => setIsMobileMenuOpen(false)} />
              ))}
            </div>
          </div>
        </div>
      </nav>
      )}

      <TeacherAuthDialog
        open={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        onAuthenticated={() => {
          if (!isLibraryPath) {
            navigate("/kho-hoc-lieu/1");
          }
        }}
      />

      <HocLieuDashboardScopeProvider value={dashboardScope}>
        <main className="relative min-h-[60vh]">{children}</main>
      </HocLieuDashboardScopeProvider>

      {!usesHocLieuShell ? (
      <footer className="relative bg-[#F5F7FA] pt-16 font-sans text-[#00008b]">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#cc0022] via-[#00008b] to-[#cc0022]" />

        <div className="container mx-auto px-4 pb-28 md:px-6 md:pb-32">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-start">
              <div className="mb-6 flex items-center gap-2">
                <div className="p-1">
                  <HeaderImage
                    src="https://media.erg.edu.vn/logo/erg.png"
                    alt="Edurise Global Logo"
                    width={100}
                    height={45}
                    className="h-auto w-[100px] object-contain"
                  />
                </div>
                <span className="text-xl font-extrabold tracking-tight text-[#00008b]">Edurise Global</span>
              </div>
              <p className="mb-8 pr-4 text-justify font-medium leading-relaxed text-slate-600">
                Há»‡ thá»‘ng giÃ¡o dá»¥c vá» cÃ´ng nghá»‡ hÃ ng Ä‘áº§u, cam káº¿t mang láº¡i cháº¥t lÆ°á»£ng Ä‘Ã o táº¡o tá»‘t nháº¥t cho tháº¿ há»‡ tráº» Viá»‡t Nam. KhÆ¡i dáº­y tiá»m nÄƒng, kiáº¿n táº¡o tÆ°Æ¡ng lai.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/eduriseerg"
                  aria-label="Facebook"
                  className="group rounded-full border border-slate-100 bg-white p-3 shadow-sm transition-all duration-300 hover:bg-[#00008b]"
                >
                  <FacebookIcon className="h-5 w-5 text-[#00008b] transition-colors group-hover:text-white" />
                </a>
                <a
                  href="#"
                  aria-label="YouTube"
                  className="group rounded-full border border-slate-100 bg-white p-3 shadow-sm transition-all duration-300 hover:bg-[#cc0022]"
                >
                  <YoutubeIcon className="h-5 w-5 text-[#00008b] transition-colors group-hover:text-white" />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="group rounded-full border border-slate-100 bg-white p-3 shadow-sm transition-all duration-300 hover:bg-pink-600"
                >
                  <InstagramIcon className="h-5 w-5 text-[#00008b] transition-colors group-hover:text-white" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="relative mb-8 inline-block text-lg font-bold uppercase tracking-wide text-[#00008b]">
                Trá»¥ sá»Ÿ chÃ­nh
                <span className="absolute -bottom-2 left-0 h-1 w-12 rounded-full bg-[#cc0022]" />
              </h3>
              <ul className="space-y-6">
                <li className="group flex items-start gap-4">
                  <div className="mt-1 shrink-0 rounded-full border border-slate-50 bg-white p-2.5 text-[#cc0022] shadow-sm transition-all group-hover:bg-[#cc0022] group-hover:text-white">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Trá»¥ sá»Ÿ chÃ­nh</span>
                    <a
                      href="https://maps.app.goo.gl/nkpn1e1KZJ1ZvrYg8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block font-semibold leading-tight text-[#00008b] transition-colors hover:text-[#cc0022]"
                    >
                      Sá»‘ 83B, ÄÆ°á»ng HoÃ ng Sa, PhÆ°á»ng TÃ¢n Äá»‹nh, TP. Há»“ ChÃ­ Minh
                    </a>
                  </div>
                </li>

                <li className="group flex items-start gap-4">
                  <div className="shrink-0 rounded-full border border-slate-50 bg-white p-2.5 text-[#cc0022] shadow-sm transition-all group-hover:bg-[#cc0022] group-hover:text-white">
                    <Phone size={20} />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Hotline</span>
                    <a href="tel:0766144888" className="text-lg font-bold text-[#00008b] transition-colors hover:text-[#cc0022]">
                      0766.144.888
                    </a>
                  </div>
                </li>

                <li className="group flex items-start gap-4">
                  <div className="shrink-0 rounded-full border border-slate-50 bg-white p-2.5 text-[#cc0022] shadow-sm transition-all group-hover:bg-[#cc0022] group-hover:text-white">
                    <Mail size={20} />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Email</span>
                    <a href="mailto:info@erg.edu.vn" className="font-medium text-[#00008b] transition-colors hover:text-[#cc0022]">
                      info@erg.edu.vn
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="relative mb-8 inline-block text-lg font-bold uppercase tracking-wide text-[#00008b]">
                Chi nhÃ¡nh
                <span className="absolute -bottom-2 left-0 h-1 w-12 rounded-full bg-[#cc0022]" />
              </h3>
              <ul className="space-y-6">
                <li className="group flex items-start gap-4">
                  <div className="mt-1 shrink-0 rounded-full border border-slate-50 bg-white p-2.5 text-[#cc0022] shadow-sm transition-all group-hover:bg-[#cc0022] group-hover:text-white">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Äá»‹a chá»‰</span>
                    <a
                      href="https://maps.app.goo.gl/A5izGLp4PALPgjX26"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block font-semibold leading-tight text-[#00008b] transition-colors hover:text-[#cc0022]"
                    >
                      Trung tÃ¢m Tin há»c ERG, Sá»‘ 40-42, ÄÆ°á»ng BÃ¬nh PhÃº, PhÆ°á»ng BÃ¬nh PhÃº, TP. Há»“ ChÃ­ Minh
                    </a>
                  </div>
                </li>

                <li className="group flex items-start gap-4">
                  <div className="shrink-0 rounded-full border border-slate-50 bg-white p-2.5 text-[#cc0022] shadow-sm transition-all group-hover:bg-[#cc0022] group-hover:text-white">
                    <Phone size={20} />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Hotline</span>
                    <a href="tel:0967689259" className="text-lg font-bold text-[#00008b] transition-colors hover:text-[#cc0022]">
                      0967.689.259
                    </a>
                  </div>
                </li>

                <li className="group flex items-start gap-4">
                  <div className="shrink-0 rounded-full border border-slate-50 bg-white p-2.5 text-[#cc0022] shadow-sm transition-all group-hover:bg-[#cc0022] group-hover:text-white">
                    <Mail size={20} />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Email</span>
                    <a href="mailto:daotao@erg.edu.vn" className="font-medium text-[#00008b] transition-colors hover:text-[#cc0022]">
                      daotao@erg.edu.vn
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="relative w-full">
          <div className="absolute left-0 top-0 z-10 w-full -translate-y-[99%] overflow-hidden leading-[0]">
            <svg
              className="relative block h-[60px] w-[calc(100%+1.3px)] md:h-[100px]"
              data-name="Layer 1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                className="fill-[#00008b]"
              />
            </svg>
          </div>

          <div className="relative z-20 bg-[#00008b] pb-6 pt-2">
            <div className="container mx-auto flex flex-col items-center justify-between px-4 text-sm text-blue-200/80 md:flex-row md:px-6">
              <p className="cursor-default text-center transition-colors hover:text-white md:text-left">Â© 2026 Edurise Global. All rights reserved.</p>

              <div className="mt-4 flex items-center gap-6 md:mt-0">
                <a href="#" className="group relative transition hover:text-white">
                  Äiá»u khoáº£n sá»­ dá»¥ng
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#cc0022] transition-all group-hover:w-full" />
                </a>
                <span className="text-blue-500/50">|</span>
                <a href="#" className="group relative transition hover:text-white">
                  ChÃ­nh sÃ¡ch báº£o máº­t
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#cc0022] transition-all group-hover:w-full" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      ) : null}
    </div>
  );
}

export function HocLieuLayout() {
  return (
    <HocLieuPageLayout>
      <Outlet />
    </HocLieuPageLayout>
  );
}

