import { FolderKanban, LayoutTemplate, Presentation, Sparkles } from "lucide-react";

import { PORTFOLIO_STREAMS } from "@/features/hoclieu/api/hoclieu-data";
import {
  HocLieuCardGrid,
  HocLieuPageHero,
  HocLieuSection,
  HocLieuTimeline,
} from "@/features/hoclieu/components/hoclieu-page-shell";

export function HocLieuPortfolioPage() {
  return (
    <div className="bg-slate-50 pb-16">
      <HocLieuPageHero
        eyebrow="Teaching portfolio"
        title="Portfolio bài giảng để giáo viên tái sử dụng và nâng cấp nhanh."
        description="Khu này giữ deck mẫu, case study lớp học và template triển khai để đội ngũ tham khảo nhanh, không cần đào lại file cũ."
        stats={[
          { label: "Dòng portfolio", value: `${PORTFOLIO_STREAMS.length}` },
          { label: "Deck mẫu", value: "42" },
          { label: "Templates", value: "28" },
        ]}
        actions={[
          { label: "Xem kho học liệu", href: "/kho-hoc-lieu", icon: FolderKanban },
          { label: "Vào cộng đồng", href: "/cong-dong", icon: Sparkles, variant: "secondary" },
        ]}
      />

      <HocLieuSection
        eyebrow="Streams"
        title="Những nhánh portfolio chính trong nội bộ."
        description="Mỗi nhánh giải một bài toán khác nhau: tham khảo bài giảng, học từ lớp thật hoặc nhân bản template."
      >
        <HocLieuCardGrid
          items={PORTFOLIO_STREAMS.map((stream) => ({
            title: stream.title,
            description: stream.summary,
            meta: stream.volume,
            href: stream.href,
          }))}
        />
      </HocLieuSection>

      <HocLieuSection
        eyebrow="Assets"
        title="Một portfolio bài giảng nên có gì."
        description="Chúng tôi chốt lại theo checklist đơn giản để bất kỳ giáo viên nào mở vào cũng hiểu và tái sử dụng được."
        tone="muted"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            { title: "Deck hoàn chỉnh", detail: "Bộ slide có ghi chú nhấn mạnh, dấu mốc và cách mở bài.", icon: Presentation },
            { title: "Lesson map", detail: "Khung tiết dạy, checkpoint và mốc đánh giá trong buổi học.", icon: LayoutTemplate },
            { title: "Reflection & fixes", detail: "Điểm cần lưu ý sau khi dạy thật để người sau không lặp lại lỗi.", icon: Sparkles },
          ].map((item) => {
            const ItemIcon = item.icon;

            return (
              <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[var(--erg-blue)]">
                  <ItemIcon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </HocLieuSection>

      <HocLieuSection
        eyebrow="Build process"
        title="Quy trình để một bài giảng vào được portfolio."
        description="Portfolio không phải nơi cất file tạm. Nó cần một quy trình ngắn để bài giảng lưu lại có giá trị cho người dùng sau."
      >
        <HocLieuTimeline
          items={[
            {
              title: "Draft từ lesson kit",
              detail: "Giáo viên tạo bản đầu từ bài giảng mẫu, handout hoặc task file đã có.",
              meta: "Draft",
            },
            {
              title: "Review và dạy thử",
              detail: "Mentor hoặc đồng nghiệp xem nhanh flow bài giảng trước khi đưa vào lớp.",
              meta: "Review",
            },
            {
              title: "Chốt và lưu",
              detail: "Sau khi dạy thật, bài giảng được bổ sung note và đẩy lên kho dùng chung.",
              meta: "Archive",
            },
          ]}
        />
      </HocLieuSection>
    </div>
  );
}
