import { BookOpenCheck, FolderOpenDot, Sparkles } from "lucide-react";

import {
  COURSE_GROUPS,
  FLAT_PROGRAMS,
  HUB_COLLECTIONS,
  TOTAL_LESSON_SHELVES,
} from "@/features/hoclieu/api/hoclieu-data";
import {
  HocLieuCardGrid,
  HocLieuPageHero,
  HocLieuSection,
  HocLieuTimeline,
} from "@/features/hoclieu/components/hoclieu-page-shell";

export function HocLieuProgramsPage() {
  return (
    <div className="bg-slate-50 pb-16">
      <HocLieuPageHero
        eyebrow="Program navigator"
        title="Danh mục chương trình được gom lại để giáo viên vào đúng bộ học liệu ngay."
        description="Trang chương trình mới bỏ các khối nội dung trang trí và chỉ giữ lại nhóm chương trình, mô tả vận hành và đường đi sang kho học liệu."
        stats={[
          { label: "Chương trình", value: `${FLAT_PROGRAMS.length}` },
          { label: "Nhóm nội dung", value: `${COURSE_GROUPS.length}` },
          { label: "Lesson shelves", value: `${TOTAL_LESSON_SHELVES}+` },
        ]}
        actions={[
          { label: "Mở kho học liệu", href: "/kho-hoc-lieu", icon: FolderOpenDot },
          { label: "Xem quiz bank", href: "/quizzes", icon: BookOpenCheck, variant: "secondary" },
        ]}
      />

      <HocLieuSection
        eyebrow="Groups"
        title="Mỗi nhóm chương trình là một bộ điều hướng rõ ràng."
        description="Giáo viên không cần đọc một danh sách dài nữa. Mỗi nhóm được tách theo mục đích dạy học và đối tượng tài nguyên."
      >
        <div className="space-y-8">
          {COURSE_GROUPS.map((group) => (
            <div key={group.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--erg-red)]">{group.title}</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{group.description}</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {group.programs.length} mục
                </span>
              </div>

              <HocLieuCardGrid
                items={group.programs.map((program) => ({
                  title: program.name,
                  description: program.summary,
                  meta: program.badge,
                  href: program.href,
                  tags: program.items.map((item) => item.name),
                }))}
              />
            </div>
          ))}
        </div>
      </HocLieuSection>

      <HocLieuSection
        eyebrow="Cach to chuc"
        title="Bộ khung chung để vận hành giao diện học liệu."
        description="Layout được xây quanh tác vụ dạy học thật: chọn chương trình, vào kho học liệu, mở viewer và quay lại trong một flow liền mạch."
        tone="muted"
      >
        <HocLieuTimeline
          items={[
            {
              title: "Bắt đầu từ chương trình",
              detail: "Mỗi chương trình mở ra một tập tài nguyên và lesson kit khác nhau.",
              meta: "01",
            },
            {
              title: "Lọc trong kho học liệu",
              detail: "Nếu cần tìm tài liệu nhanh, giáo viên vào kho học liệu và lọc theo lớp, môn và nhóm.",
              meta: "02",
            },
            {
              title: "Mở viewer đúng file",
              detail: "Viewer được tách theo định dạng file để không nhầm vai trò của tài liệu.",
              meta: "03",
            },
          ]}
        />
      </HocLieuSection>

      <HocLieuSection
        eyebrow="Cross resources"
        title="Các kho tổng hợp đi cùng mỗi chương trình."
        description="Đây là các kho mà giáo viên cần quay lại thường xuyên, bất kể đang dạy Tiếng Anh, STEM, IC3, MOS hay Tin học."
      >
        <HocLieuCardGrid
          items={HUB_COLLECTIONS.map((collection) => ({
            title: collection.title,
            description: collection.subtitle,
            meta: collection.metric,
            href: collection.href,
            tags: collection.tags,
          }))}
        />
      </HocLieuSection>

      <HocLieuSection
        eyebrow="Hướng tiếp theo"
        title="Tiếp tục sang kho học liệu và các kho bổ trợ."
        description="Sau trang chương trình, giáo viên sẽ vào kho học liệu để chọn file, vào portfolio để xem bài mẫu, hoặc vào quiz bank để lấy bộ đánh giá nhanh."
        tone="dark"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { title: "Kho học liệu", detail: "Tìm và mở đúng tài liệu trước tiết dạy.", href: "/kho-hoc-lieu" },
            { title: "Portfolio", detail: "Tham khảo bài giảng mẫu và bộ template nội bộ.", href: "/portfolio" },
            { title: "Quiz bank", detail: "Lấy quiz nhanh, mock quiz và bộ đánh giá trên lớp.", href: "/quizzes" },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                <Sparkles className="h-3.5 w-3.5" />
                Continue
              </div>
              <h3 className="mt-5 text-2xl font-black tracking-tight text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/70">{item.detail}</p>
              <a
                href={item.href}
                className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white"
              >
                Mở khu vực
              </a>
            </div>
          ))}
        </div>
      </HocLieuSection>
    </div>
  );
}
