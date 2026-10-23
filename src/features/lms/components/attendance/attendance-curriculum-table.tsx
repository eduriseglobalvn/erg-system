import type { AttendanceSheetController } from "./use-attendance-sheet-controller";

export function AttendanceCurriculumTable({ controller }: { controller: AttendanceSheetController }) {
  return (
    <div style={{ minHeight: 0, backgroundColor: "white", border: "1px solid #D9E2EF", borderRadius: 10, boxShadow: "0 10px 26px rgba(15,23,42,0.04)", overflow: "auto" }}>
      {controller.teachingPlanLoading ? <div style={planNoticeStyle}>Đang tải lịch dạy…</div> : null}
      {controller.teachingPlanMissing ? <div style={{ ...planNoticeStyle, backgroundColor: "#FFF8E8", color: "#8A5A00" }}>Chưa cấu hình lịch dạy cho trường, môn và năm học này. Admin cần thiết lập trong Cấu trúc môn học.</div> : null}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: "#1C252E" }}>
        <thead>
          <tr><th colSpan={3} style={curriculumTitleCellStyle}>KHUNG CHƯƠNG TRÌNH TIN HỌC QUỐC TẾ</th></tr>
          <tr><th colSpan={3} style={curriculumSubtitleCellStyle}>{controller.selectedSubject}</th></tr>
          <tr>
            <th style={curriculumHeadCellStyle("27%")}>Chủ đề</th>
            <th style={curriculumHeadCellStyle(44)}>Tiết</th>
            <th style={curriculumHeadCellStyle()}>Tên bài học</th>
          </tr>
        </thead>
        <tbody>
          {controller.curriculumProgram.map((item, index) => {
            const isCurrent = Boolean(controller.teachingPlan) && item.period === controller.taughtLessonCount;
            const isDone = Boolean(controller.teachingPlan) && item.period < controller.taughtLessonCount;
            const showTopicCell = controller.curriculumTopicSpans.firstRows.get(item.topic) === index;
            return (
              <tr key={item.period} style={{ backgroundColor: isCurrent ? "#F3F4FF" : isDone ? "#F8FAFC" : "white" }}>
                {showTopicCell ? (
                  <td rowSpan={controller.curriculumTopicSpans.counts.get(item.topic)} style={curriculumTopicCellStyle}>{item.topic}</td>
                ) : null}
                <td
                  style={{
                    ...curriculumBodyCellStyle("center"),
                    backgroundColor: isCurrent ? "#696CFF" : undefined,
                    borderColor: isCurrent ? "#696CFF" : "#D9E2EF",
                    color: isCurrent ? "#FFFFFF" : undefined,
                    fontWeight: isCurrent ? 800 : 400,
                  }}
                >
                  {item.period}
                </td>
                <td
                  style={{
                    ...curriculumBodyCellStyle("left"),
                    backgroundColor: isCurrent ? "#EEF0FF" : undefined,
                    border: isCurrent ? "2px solid #696CFF" : "1px solid #D9E2EF",
                    color: isCurrent ? "#3033B8" : undefined,
                    fontStyle: isCurrent ? "italic" : undefined,
                    fontWeight: isCurrent ? 800 : 400,
                  }}
                >
                  {item.title}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const planNoticeStyle = { backgroundColor: "#EEF6FF", borderBottom: "1px solid #D9E2EF", color: "#0F6CBD", fontSize: 12, fontWeight: 700, padding: "8px 10px" };

const curriculumTitleCellStyle = {
  background: "linear-gradient(180deg, #FFFFFF 0%, #F7F8FF 100%)",
  border: "1px solid #D9E2EF",
  color: "#1C252E",
  fontSize: 15,
  fontWeight: 800,
  lineHeight: "22px",
  padding: "7px 10px 4px",
  textAlign: "center" as const,
};

const curriculumSubtitleCellStyle = { ...curriculumTitleCellStyle, fontSize: 14 };

const curriculumHeadCellStyle = (width?: string | number) => ({
  backgroundColor: "#F4F6F8",
  border: "1px solid #D9E2EF",
  color: "#52616F",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: "18px",
  padding: "2px 6px",
  textAlign: "center" as const,
  width,
});

const curriculumTopicCellStyle = {
  backgroundColor: "#FBFCFF",
  border: "1px solid #D9E2EF",
  color: "#334155",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: "18px",
  padding: "2px 6px",
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
  width: "27%",
};

const curriculumBodyCellStyle = (textAlign: "left" | "center") => ({
  border: "1px solid #D9E2EF",
  color: "#334155",
  fontSize: 12,
  fontWeight: 600,
  lineHeight: "17px",
  padding: "1px 5px",
  textAlign,
  verticalAlign: "middle" as const,
});
