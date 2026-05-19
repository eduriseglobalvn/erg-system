import { BrainCircuit, ChartColumn, CircleCheckBig, ClipboardList } from "lucide-react";

import { QUIZ_TRACKS } from "@/features/hoclieu/api/hoclieu-data";
import {
  HocLieuCardGrid,
  HocLieuPageHero,
  HocLieuSection,
  HocLieuTimeline,
} from "@/features/hoclieu/components/hoclieu-page-shell";

export function HocLieuQuizzesPage() {
  return (
    <div className="bg-slate-50 pb-16">
      <HocLieuPageHero
        eyebrow="Assessment hub"
        title="Quiz bank để kiểm tra nhanh, mock quiz và theo dõi tiến độ."
        description="Khu này gom warm-up quiz, checkpoint, quiz giữa buổi và mock sets để giáo viên lấy nhanh đúng bộ đánh giá cho lớp."
        stats={[
          { label: "Quiz tracks", value: `${QUIZ_TRACKS.length}` },
          { label: "Câu hỏi", value: "990+" },
          { label: "Mock sets", value: "18" },
        ]}
        actions={[
          { label: "Mở kho học liệu", href: "/kho-hoc-lieu", icon: ClipboardList },
          { label: "Vào chương trình", href: "/chuong-trinh", icon: BrainCircuit, variant: "secondary" },
        ]}
      />

      <HocLieuSection
        eyebrow="Quiz tracks"
        title="Mỗi nhóm môn học có quiz bank riêng."
        description="Câu hỏi được gom theo IC3, MOS và Tin học để giáo viên không mất thời gian lọc thủ công."
      >
        <HocLieuCardGrid
          items={QUIZ_TRACKS.map((track) => ({
            title: track.title,
            description: track.summary,
            meta: track.questionCount,
            href: track.href,
          }))}
        />
      </HocLieuSection>

      <HocLieuSection
        eyebrow="Assessment types"
        title="Các lớp đánh giá có trong hệ thống."
        description="Bài học tốt cần nhiều lớp kiểm tra khác nhau. UI quiz bank cần giúp giáo viên phân biệt vai trò từng bộ."
        tone="muted"
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Warm-up", detail: "Khởi động 3-5 phút để gợi lại kiến thức cũ.", icon: BrainCircuit },
            { title: "Checkpoint", detail: "Bộ câu hỏi giữa tiết để chặn sớm phần học sinh chưa theo kịp.", icon: CircleCheckBig },
            { title: "Exit ticket", detail: "Đánh giá cuối buổi và xác định nội dung cần bổ sung.", icon: ClipboardList },
            { title: "Mock quiz", detail: "Bộ quiz mô phỏng để giáo viên dùng cho buổi ôn tập.", icon: ChartColumn },
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
        eyebrow="Assessment flow"
        title="Luồng đánh giá đi cùng lesson kit."
        description="Quiz bank được đặt như một tầng bổ trợ cho giao diện học liệu, không tách rời khỏi flow dạy học."
      >
        <HocLieuTimeline
          items={[
            {
              title: "Lấy quiz đúng module",
              detail: "Bắt đầu từ đúng chương trình hoặc đúng nhóm môn để chọn bộ quiz phù hợp.",
              meta: "01",
            },
            {
              title: "Chấm và nhìn lỗi nhanh",
              detail: "Dùng answer map hoặc rubric để xác định objective nào đang yếu.",
              meta: "02",
            },
            {
              title: "Quay lại học liệu",
              detail: "Từ kết quả quiz, giáo viên quay lại lấy slide, worksheet hoặc bài tập bổ sung.",
              meta: "03",
            },
          ]}
        />
      </HocLieuSection>
    </div>
  );
}
