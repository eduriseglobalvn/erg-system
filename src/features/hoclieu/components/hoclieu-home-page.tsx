import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  LockKeyhole,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { HocLieuLink as Link } from "@/features/hoclieu/components/hoclieu-link";

type IntroItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const introItems: IntroItem[] = [
  {
    title: "Chuẩn bị bài dạy nhanh hơn",
    description: "Giáo viên có một điểm vào rõ ràng để tìm chương trình, tài liệu, bài giảng và bộ câu hỏi cần dùng.",
    icon: BookOpen,
  },
  {
    title: "Tài nguyên được sắp xếp",
    description: "Học liệu được tổ chức theo chương trình, môn học, lớp và định dạng để giảm thời gian tìm kiếm.",
    icon: CheckCircle2,
  },
  {
    title: "Không gian nội bộ ERG",
    description: "Kho học liệu và viewer chỉ mở cho tài khoản giáo viên đã được xác thực trong hệ thống.",
    icon: ShieldCheck,
  },
];

const portalAreas = ["Chương trình", "Kho học liệu", "Bài giảng điện tử", "Quiz bank", "Portfolio", "Cộng đồng"];

function IntroCard({ title, description, icon: Icon }: IntroItem) {
  return (
    <article className="rounded-lg border border-[var(--erg-border)] bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--erg-blue)]/8 text-[var(--erg-blue)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-black tracking-tight text-[var(--erg-text)]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--erg-muted)]">{description}</p>
    </article>
  );
}

export function HocLieuHomePage() {
  return (
    <div className="bg-[var(--erg-bg)]">
      <section className="border-b border-[var(--erg-border)] bg-white">
        <div className="mx-auto grid max-w-[92rem] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:px-8 lg:py-24">
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--erg-red)]">Teacher Hub</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.04] tracking-tight text-[var(--erg-text)] sm:text-5xl md:text-6xl">
              hoclieu.erg.edu.vn
              <span className="block text-[var(--erg-blue)]">Cổng học liệu nội bộ cho giáo viên ERG.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--erg-muted)]">
              Trang giới thiệu ngắn gọn về hệ thống học liệu dành cho giáo viên. Sau khi đăng nhập, giáo viên có thể mở kho tài nguyên, bài giảng điện tử, quiz bank và các khu vực chuyên môn liên quan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/kho-hoc-lieu"
                className="inline-flex items-center justify-center gap-3 rounded-lg bg-[var(--erg-blue)] px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-blue-900/10 transition hover:-translate-y-0.5 hover:bg-[var(--erg-red)]"
              >
                Vào kho học liệu
                <BookOpen className="h-5 w-5" />
              </Link>
              <Link
                href="/chuong-trinh"
                className="inline-flex items-center justify-center gap-3 rounded-lg border border-[var(--erg-border)] bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-[var(--erg-text)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--erg-blue)]/30"
              >
                Xem chương trình
                <Search className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-[var(--erg-border)] bg-[var(--erg-surface)] p-6 shadow-[var(--erg-shadow-lg)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--erg-blue)] text-white">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-[var(--erg-text)]">Truy cập dành cho giáo viên</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--erg-muted)]">
                  Trang chủ có thể xem công khai. Kho học liệu, viewer và dữ liệu chi tiết chỉ mở sau khi xác thực tài khoản giáo viên.
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-[var(--erg-border)] pt-5">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Khu vực trong portal</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {portalAreas.map((area) => (
                  <span key={area} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-[var(--erg-text)] md:text-4xl">Giới thiệu vừa đủ, vào việc nhanh.</h2>
          <p className="mt-4 text-base leading-8 text-[var(--erg-muted)]">
            Trang chủ không cần trình diễn toàn bộ dữ liệu. Vai trò chính là nói rõ hệ thống dùng để làm gì và dẫn giáo viên đến đúng khu vực.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {introItems.map((item) => (
            <IntroCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--erg-border)] bg-white py-16">
        <div className="mx-auto grid max-w-[92rem] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[var(--erg-text)] md:text-4xl">Thiết kế cho công việc hằng ngày của giáo viên.</h2>
            <p className="mt-4 text-base leading-8 text-[var(--erg-muted)]">
              Portal ưu tiên các thao tác thực tế: xem chương trình đang dạy, mở học liệu đúng định dạng, dùng tài nguyên trên lớp và lưu lại tư liệu cần theo dõi.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              "Tìm học liệu theo chương trình, lớp, môn và loại file.",
              "Mở PDF, PPTX, video, audio hoặc quiz bằng đúng viewer.",
              "Kết nối portfolio và cộng đồng chuyên môn nội bộ.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-[var(--erg-border)] bg-[var(--erg-bg)] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--erg-blue)]" />
                <p className="text-sm font-bold leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-[linear-gradient(135deg,var(--erg-blue)_0%,#172554_64%,var(--erg-red)_150%)] p-8 text-white shadow-[var(--erg-shadow-lg)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">Giáo viên đăng nhập để sử dụng kho học liệu.</h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-white/75">
                Các tài nguyên chi tiết được bảo vệ bằng tài khoản giáo viên ERG để đảm bảo phân quyền, bản quyền và dữ liệu triển khai nội bộ.
              </p>
            </div>
            <Link
              href="/kho-hoc-lieu"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-[var(--erg-blue)] transition hover:-translate-y-0.5"
            >
              Mở kho học liệu
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
