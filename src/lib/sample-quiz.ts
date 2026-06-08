import { defaultQuizTheme } from "@/lib/quiz-themes";
import type { Feedback, Quiz } from "@/lib/types";

const standardFeedback: Feedback = {
  correct: "Chính xác. Em xử lý rất tốt.",
  incorrect: "Chưa đúng rồi. Em xem lại gợi ý và thử ở lần sau nhé.",
  partial: "Em đã đúng một phần, tiếp tục rà soát các lựa chọn còn lại.",
};

const hotspotMockImage = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop stop-color="#eff6ff"/>
        <stop offset="1" stop-color="#dff7ff"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="675" fill="url(#bg)"/>
    <rect x="135" y="105" width="930" height="465" rx="34" fill="#ffffff" stroke="#9cc7ff" stroke-width="8"/>
    <rect x="180" y="160" width="840" height="64" rx="18" fill="#0f6cbd" opacity="0.9"/>
    <rect x="190" y="270" width="360" height="210" rx="24" fill="#f1f5f9"/>
    <rect x="625" y="284" width="300" height="150" rx="24" fill="#fff7ed" stroke="#f97316" stroke-width="6"/>
    <text x="215" y="200" font-family="Inter" font-size="30" font-weight="700" fill="#ffffff">System Settings</text>
    <text x="660" y="345" font-family="Inter" font-size="32" font-weight="700" fill="#0f172a">Version 23H2</text>
    <text x="660" y="392" font-family="Inter" font-size="24" fill="#475569">Build 22631</text>
  </svg>
`)}`;

function createCableMockImage(label: string, color: string) {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <rect width="240" height="240" rx="36" fill="#ffffff"/>
      <path d="M118 36h16v48h-16z" fill="#cbd5e1"/>
      <rect x="92" y="72" width="68" height="36" rx="10" fill="${color}"/>
      <rect x="103" y="112" width="46" height="70" rx="18" fill="#111827"/>
      <rect x="109" y="182" width="34" height="18" rx="8" fill="#1f2937"/>
      <path d="M120 198v18c0 10 8 18 18 18h8" stroke="#111827" stroke-width="8" stroke-linecap="round" fill="none"/>
      <text x="120" y="222" text-anchor="middle" font-family="Inter" font-size="20" font-weight="700" fill="#334155">${label}</text>
    </svg>
  `)}`;
}

const cableUsbCImage = createCableMockImage("USB-C", "#60a5fa");
const cableUsbAImage = createCableMockImage("USB-A", "#34d399");
const cableHdmiImage = createCableMockImage("HDMI", "#f59e0b");
const cableLightningImage = createCableMockImage("LIGHT", "#f472b6");

export const sampleQuiz: Quiz = {
  id: "avs-demo",
  title: "GS6 LV3 OTTHBS (TRAINING)",
  subtitle: "Demo 14 dạng câu hỏi",
  version: "2.0",
  description: "Bộ câu hỏi mẫu để học sinh xem và làm thử toàn bộ dạng câu hỏi ERG hỗ trợ.",
  themeId: defaultQuizTheme.id,
  theme: { ...defaultQuizTheme.theme },
  settings: {
    mode: "training",
    timeLimitMinutes: 30,
    passPercent: 80,
    shuffleQuestions: false,
    shuffleChoices: false,
    revealFeedbackPerStep: true,
  },
  result: {
    passMessage: "Chúc mừng, em đã hoàn thành tốt bài demo.",
    failMessage: "Em đã hoàn thành bài demo. Hãy review lại các câu còn sai nhé.",
    reviewButtonLabel: "REVIEW QUIZ",
    thankYouMessage: "Cảm ơn em đã hoàn thành bài làm.",
    showReviewButton: true,
    submitAllPrompt: "Em đã trả lời hết câu hỏi. Em muốn nộp bài ngay không?",
    confirmSubmitPrompt: "Em chắc chắn muốn nộp bài và kết thúc lượt làm này chứ?",
    submitAllLabel: "NỘP BÀI",
    returnToQuizLabel: "QUAY LẠI",
    confirmYesLabel: "CÓ",
    confirmNoLabel: "KHÔNG",
  },
  sections: [
    {
      id: "section-question-types",
      title: "Demo tất cả loại câu hỏi",
      questions: [
        {
          id: "q1-single-choice",
          kind: "single_choice",
          title: "Bạn không thể gửi tập tin nào sau đây qua một nhà cung cấp email tiêu chuẩn?",
          points: 10,
          feedback: standardFeedback,
          choices: [
            { id: "q1-a", label: "Tập tin văn bản thuần dài 400 trang.", correct: true },
            { id: "q1-b", label: "Hình GIF động có độ phân giải 1080p với 30 khung hình.", correct: false },
            { id: "q1-c", label: "Video dài 1 phút có độ phân giải 8K, định dạng AVI.", correct: false },
            { id: "q1-d", label: "Podcast dài 5 phút có định dạng MP3.", correct: false },
          ],
        },
        {
          id: "q2-multiple-response",
          kind: "multiple_response",
          title: "Chọn các hành động giúp bài nộp trực tuyến rõ ràng và dễ chấm hơn.",
          points: 10,
          feedback: standardFeedback,
          choices: [
            { id: "q2-a", label: "Đặt tên file theo cú pháp giáo viên yêu cầu.", correct: true },
            { id: "q2-b", label: "Nén ảnh hoặc video nếu dung lượng quá lớn.", correct: true },
            { id: "q2-c", label: "Kiểm tra lại file trước khi nộp.", correct: true },
            { id: "q2-d", label: "Tải một file bất kỳ để hoàn thành cho nhanh.", correct: false },
          ],
        },
        {
          id: "q3-true-false",
          kind: "true_false",
          title: "Bật xác thực hai lớp giúp tài khoản học tập an toàn hơn.",
          points: 10,
          feedback: standardFeedback,
          choices: [
            { id: "q3-true", label: "Đúng", correct: true },
            { id: "q3-false", label: "Sai", correct: false },
          ],
        },
        {
          id: "q4-short-answer",
          kind: "short_answer",
          title: "Tên định dạng file thường dùng để nộp bài đọc được trên nhiều máy là gì?",
          points: 10,
          feedback: standardFeedback,
          textBlanks: [
            {
              id: "q4-answer",
              label: "Câu trả lời ngắn",
              placeholder: "Ví dụ: PDF",
              correctAnswers: ["PDF", "file PDF", "tệp PDF"],
            },
          ],
        },
        {
          id: "q5-numeric",
          kind: "numeric",
          title: "Một tài liệu được phép nộp tối đa bao nhiêu trang theo quy định mock?",
          points: 10,
          feedback: standardFeedback,
          numericAnswer: {
            correctValue: 400,
            tolerance: 0,
            unit: "trang",
          },
        },
        {
          id: "q6-sequence",
          kind: "sequence",
          title: "Sắp xếp quy trình học tập online theo thứ tự hợp lý.",
          points: 10,
          feedback: standardFeedback,
          sequenceItems: [
            { id: "q6-step-1", label: "Đọc yêu cầu bài học" },
            { id: "q6-step-2", label: "Xem tài liệu hoặc video hướng dẫn" },
            { id: "q6-step-3", label: "Làm bài luyện tập" },
            { id: "q6-step-4", label: "Xem phản hồi và sửa lỗi" },
          ],
        },
        {
          id: "q7-matching",
          kind: "matching",
          title: "Ghép các bước trong chu trình quản lý dự án với mô tả của nó.",
          points: 10,
          feedback: standardFeedback,
          matching: [
            { id: "q7-pair-1", prompt: "Giám sát (Monitoring)", response: "Theo dõi tiến độ và rủi ro dự án." },
            { id: "q7-pair-2", prompt: "Khởi tạo (Initiation)", response: "Quyết định có theo đuổi dự án hay không." },
            { id: "q7-pair-3", prompt: "Thực hiện (Execution)", response: "Tạo ra sản phẩm dự án." },
            { id: "q7-pair-4", prompt: "Đóng (Close)", response: "Bàn giao và đánh giá dự án." },
          ],
        },
        {
          id: "q7b-matching-image",
          kind: "matching",
          title: "Match each connector name with the correct image.",
          instructions: "Tap a row to open the answer picker with image options.",
          points: 10,
          feedback: standardFeedback,
          matching: [
            { id: "q7b-pair-1", prompt: "USB-C", response: "USB-C connector", responseImage: { url: cableUsbCImage, alt: "USB-C cable" } },
            { id: "q7b-pair-2", prompt: "USB-A", response: "USB-A connector", responseImage: { url: cableUsbAImage, alt: "USB-A cable" } },
            { id: "q7b-pair-3", prompt: "HDMI", response: "HDMI connector", responseImage: { url: cableHdmiImage, alt: "HDMI cable" } },
            { id: "q7b-pair-4", prompt: "Lightning", response: "Lightning connector", responseImage: { url: cableLightningImage, alt: "Lightning cable" } },
          ],
        },
        {
          id: "q8-fill-blank",
          kind: "fill_blank",
          title: "Điền từ còn thiếu để hoàn thành câu bảo mật tài khoản.",
          points: 10,
          feedback: standardFeedback,
          textBlanks: [
            {
              id: "q8-blank-1",
              label: "mật khẩu",
              prefix: "Em nên dùng",
              suffix: "mạnh",
              placeholder: "......",
              correctAnswers: ["mật khẩu", "mat khau"],
            },
            {
              id: "q8-blank-2",
              label: "hai lớp",
              prefix: "và bật xác thực",
              suffix: "khi có thể.",
              placeholder: "......",
              correctAnswers: ["hai lớp", "2 lớp", "2 lop"],
            },
          ],
        },
        {
          id: "q9-select-from-lists",
          kind: "select_from_lists",
          title: "Với mỗi tình huống, chọn Có nếu nên báo cáo hoặc Không nếu không cần.",
          points: 10,
          feedback: standardFeedback,
          inlineBlanks: [
            {
              id: "q9-blank-1",
              statement: "Bản sao của bài kiểm tra lịch sử ngày mai bị đăng lên mạng.",
              options: ["yes", "no"],
              correctOptionId: "yes",
              selectPosition: "after",
            },
            {
              id: "q9-blank-2",
              statement: "Một ảnh chụp vui không chứa thông tin riêng tư.",
              options: ["yes", "no"],
              correctOptionId: "no",
              selectPosition: "after",
            },
            {
              id: "q9-blank-3",
              statement: "Đe dọa bạo lực đối với thành viên câu lạc bộ.",
              options: ["yes", "no"],
              correctOptionId: "yes",
              selectPosition: "after",
            },
          ],
        },
        {
          id: "q10-drag-words",
          kind: "drag_words",
          title: "Bấm từ trong ngân hàng để đưa vào đúng chỗ trống.",
          points: 10,
          feedback: standardFeedback,
          wordBank: [
            { id: "word-source", label: "nguồn" },
            { id: "word-update", label: "cập nhật" },
            { id: "word-safe", label: "an toàn" },
          ],
          wordSlots: [
            { id: "slot-source", label: "Khi tải tài liệu, hãy kiểm tra", correctWordId: "word-source" },
            { id: "slot-update", label: "và luôn", correctWordId: "word-update" },
          ],
        },
        {
          id: "q11-hotspot",
          kind: "hotspot",
          title: "Bấm vào vùng thông tin phiên bản trong màn hình minh họa.",
          points: 10,
          feedback: standardFeedback,
          hotspotImage: {
            url: hotspotMockImage,
            width: 1200,
            height: 675,
          },
          hotspotAreas: [
            {
              id: "q11-area-version",
              shape: "rect",
              x: 0.52,
              y: 0.42,
              width: 0.26,
              height: 0.22,
              correct: true,
            },
          ],
        },
        {
          id: "q12-drag-drop",
          kind: "drag_drop",
          title: "Phân loại các món vào nhóm phù hợp.",
          points: 10,
          feedback: standardFeedback,
          dropTargets: [
            { id: "target-healthy", label: "Thực phẩm tốt" },
            { id: "target-snack", label: "Đồ ăn vặt" },
          ],
          dragDropItems: [
            { id: "item-broccoli", label: "Broccoli", correctTargetId: "target-healthy" },
            { id: "item-apple", label: "Apple", correctTargetId: "target-healthy" },
            { id: "item-cookie", label: "Cookie", correctTargetId: "target-snack" },
            { id: "item-chips", label: "Chips", correctTargetId: "target-snack" },
          ],
        },
        {
          id: "q13-likert",
          kind: "likert_scale",
          title: "Đánh giá mức độ đồng ý của em sau bài học.",
          points: 10,
          feedback: {
            correct: "Câu trả lời khảo sát đã được ghi nhận.",
            incorrect: "Vui lòng chọn đủ các dòng khảo sát.",
            partial: "Em còn thiếu một số dòng khảo sát.",
          },
          likertRows: [
            { id: "likert-understand", label: "Em hiểu nội dung bài hôm nay" },
            { id: "likert-confident", label: "Em tự tin làm bài tập tương tự" },
            { id: "likert-practice", label: "Em muốn luyện thêm dạng này" },
          ],
          likertScale: [
            { id: "scale-1", label: "Rất thấp", value: 1 },
            { id: "scale-2", label: "Thấp", value: 2 },
            { id: "scale-3", label: "Vừa", value: 3 },
            { id: "scale-4", label: "Tốt", value: 4 },
            { id: "scale-5", label: "Rất tốt", value: 5 },
          ],
        },
        {
          id: "q14-essay",
          kind: "essay",
          title: "Viết ngắn cách em sẽ giải thích chủ đề an toàn tài khoản cho bạn cùng lớp.",
          points: 10,
          feedback: {
            correct: "Bài tự luận đã được ghi nhận để giáo viên đánh giá.",
            incorrect: "Em cần viết nội dung trước khi nộp.",
            partial: "Bài viết đã được ghi nhận.",
          },
          essayRubric: [
            { id: "rubric-example", label: "Có ví dụ rõ ràng", points: 4 },
            { id: "rubric-explain", label: "Giải thích dễ hiểu", points: 4 },
            { id: "rubric-clean", label: "Trình bày sạch", points: 2 },
          ],
        },
      ],
    },
  ],
};
