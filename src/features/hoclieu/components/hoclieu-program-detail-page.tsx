import { ArrowLeft, BookOpenCheck, FolderKanban, LibraryBig, Users } from "lucide-react";
import { useParams } from "react-router-dom";

import { getProgramDetailBySlug } from "@/features/hoclieu/api/hoclieu-data";
import { HocLieuLink as Link } from "@/features/hoclieu/components/hoclieu-link";
import {
  HocLieuCardGrid,
  HocLieuPageHero,
  HocLieuSection,
  HocLieuTimeline,
} from "@/features/hoclieu/components/hoclieu-page-shell";

export function HocLieuProgramDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const detail = getProgramDetailBySlug(slug);

  if (!detail) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-slate-50 px-4 py-20">
        <div className="max-w-xl rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--erg-red)]">Program not found</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Chương trình này chưa được cấu hình.</h1>
          <Link
            href="/chuong-trinh"
            className="mt-6 inline-flex rounded-2xl bg-[var(--erg-blue)] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
          >
            Quay lại chương trình
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 pb-16">
      <HocLieuPageHero
        eyebrow={detail.eyebrow}
        title={detail.title}
        description={detail.description}
        stats={detail.stats}
        actions={[
          { label: "Mở kho học liệu", href: "/kho-hoc-lieu", icon: LibraryBig },
          { label: "Vào cộng đồng", href: "/cong-dong", icon: Users, variant: "secondary" },
        ]}
      />

      <div className="mx-auto max-w-[92rem] px-4 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/chuong-trinh"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh mục chương trình
        </Link>
      </div>

      <HocLieuSection
        eyebrow="Modules"
        title="Cấu trúc dạy học của chương trình."
        description="Mỗi chương trình được chia thành các nhóm nội dung rõ ràng để giáo viên lên plan, bố trí viewer và tìm tài liệu nhanh."
      >
        <HocLieuTimeline
          items={detail.modules.map((module) => ({
            title: module.title,
            detail: module.detail,
            meta: module.duration,
          }))}
        />
      </HocLieuSection>

      <HocLieuSection
        eyebrow="Resource stack"
        title="Nhóm tài liệu và viewer đi cùng chương trình."
        description="Trang detail không có quá nhiều text mô tả. Mục tiêu là cho giáo viên thấy nhóm tài liệu chính và định dạng viewer cần dùng."
        tone="muted"
      >
        <HocLieuCardGrid
          items={detail.resources.map((resource) => ({
            title: resource.title,
            description: resource.detail,
            meta: resource.type,
            href: "/kho-hoc-lieu",
          }))}
        />
      </HocLieuSection>

      <HocLieuSection
        eyebrow="Workflow"
        title="Luồng sử dụng để giáo viên dạy thật."
        description="Sau khi vào chương trình, giáo viên sẽ đi theo một flow ngắn gọn để không phải tự tìm lại tài liệu ở nhiều nơi."
      >
        <HocLieuTimeline
          items={detail.workflow.map((step, index) => ({
            title: step.title,
            detail: step.detail,
            meta: `Pha ${index + 1}`,
          }))}
        />
      </HocLieuSection>

      <HocLieuSection
        eyebrow="Support"
        title="Lớp hỗ trợ để FE và BE tích hợp đến nơi đầy đủ."
        description="Đây là những ghi chú vận hành quan trọng để giao diện đi tiếp từ mock data sang data thật mà không phải đổi lại cấu trúc."
        tone="dark"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {detail.support.map((support) => (
            <div key={support.title} className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <h3 className="text-2xl font-black tracking-tight text-white">{support.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/70">{support.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { title: "Kho học liệu", href: "/kho-hoc-lieu", icon: LibraryBig },
            { title: "Portfolio", href: "/portfolio", icon: FolderKanban },
            { title: "Quiz bank", href: "/quizzes", icon: BookOpenCheck },
          ].map((item) => {
            const ItemIcon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <ItemIcon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </HocLieuSection>
    </div>
  );
}
