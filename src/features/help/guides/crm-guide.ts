import { installChapter } from "@/features/help/guides/install-chapter";
import type { HelpGuide } from "@/features/help/help-types";

const crmGuide: HelpGuide = {
  title: "Hướng dẫn CRM",
  intro: "Các bước đi theo quy trình chốt trường: tư vấn, cơ hội, P&L, follow-up, rồi bàn giao để triển khai.",
  chapters: [
    {
      id: "bat-dau",
      title: "Bắt đầu",
      steps: [
        { text: "Mở trang đăng nhập ERG. Nhập tài khoản và «Mật khẩu», rồi nhấn «Đăng nhập»." },
        { text: "Quên mật khẩu: nhấn «Quên mật khẩu?». Bạn cần liên hệ quản trị viên ERG để được cấp lại.", note: "Nhập sai mật khẩu 5 lần liền thì tài khoản bị tạm khoá 15 phút." },
        { text: "Menu bên trái có: «Tổng quan CRM», «Trường đã tư vấn», «Opportunity», «P&L chốt trường», «Lịch follow-up», «Bàn giao triển khai»." },
        { text: "Nếu thấy «CRM chưa có dữ liệu», tức là chưa có trường nào được tạo trong CRM." },
      ],
    },
    {
      id: "tong-quan",
      title: "Xem tổng quan",
      steps: [
        { text: "Vào «Tổng quan CRM» để xem số trường đang tư vấn, doanh thu dự kiến và margin." },
        { text: "Khung việc cần xử lý cho biết trường nào cần gọi lại hoặc còn thiếu dữ liệu." },
      ],
    },
    {
      id: "truong-tu-van",
      title: "Theo dõi trường đã tư vấn",
      steps: [
        { text: "Vào «Trường đã tư vấn». Mỗi dòng là một trường cùng tình trạng: đang tư vấn, chờ chốt, đàm phán, chờ triển khai hoặc active." },
        { text: "Nhấn «Mở hồ sơ» để xem chi tiết một trường." },
        { text: "Vào «Opportunity» để xem cơ hội theo trường, chương trình, năm học và xác suất chốt." },
      ],
    },
    {
      id: "pnl",
      title: "Lập P&L trước khi chốt",
      steps: [
        { text: "Vào «P&L chốt trường» (hoặc nhấn «Xem P&L» ở một trường)." },
        { text: "Xem doanh thu, chi phí, lợi nhuận, margin và điểm hoà vốn." },
        { text: "Trường chỉ nên chốt khi P&L đạt margin tối thiểu." },
      ],
    },
    {
      id: "follow-up",
      title: "Lịch follow-up",
      steps: [
        { text: "Vào «Lịch follow-up» để xem các cuộc gọi, buổi hẹn cần làm." },
        { text: "Ưu tiên các việc có nhãn «Cần làm»." },
      ],
    },
    {
      id: "ban-giao",
      title: "Bàn giao triển khai",
      steps: [
        { text: "Vào «Bàn giao triển khai». Mỗi trường có danh sách điều kiện cần đủ." },
        { text: "Kiểm tra: «Có xác nhận chốt/hợp đồng nguyên tắc», «Có danh sách lớp dự kiến», «P&L đạt margin tối thiểu», «Xác định trung tâm phụ trách»." },
        { text: "Khi đủ hết, nhãn chuyển sang «Sẵn sàng». Nhấn «Duyệt active».", warning: "Nút «Duyệt active» bị mờ khi còn thiếu điều kiện." },
        { text: "Nhấn «Sang quản lý cơ sở» để đội vận hành tiếp tục tạo trường và lớp." },
      ],
    },
    installChapter([
      { text: "CRM cần có mạng. Khi mất mạng, chờ có mạng lại rồi mới thao tác." },
    ]),
  ],
};

export default crmGuide;
