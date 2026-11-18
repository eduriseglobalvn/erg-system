import { installChapter } from "@/features/help/guides/install-chapter";
import type { HelpGuide } from "@/features/help/help-types";

const teacherGuide: HelpGuide = {
  title: "Hướng dẫn cho giáo viên",
  intro: "Các bước đi theo một ngày dạy: xem lịch, chấm công, điểm danh và ghi sổ, giao bài, theo dõi và hỗ trợ học sinh.",
  chapters: [
    {
      id: "bat-dau",
      title: "Bắt đầu",
      steps: [
        { text: "Mở trang đăng nhập ERG. Nhập tài khoản và «Mật khẩu», rồi nhấn «Đăng nhập»." },
        {
          text: "Quên mật khẩu: nhấn «Quên mật khẩu?». Bạn cần liên hệ quản trị viên ERG để được cấp lại.",
          note: "Nhập sai mật khẩu 5 lần liền thì tài khoản bị tạm khoá 15 phút.",
        },
        { text: "Trên máy tính, menu nằm bên trái. Trên điện thoại, dùng thanh dưới cùng: «Hôm nay», «Lịch», «Học tập», «Hộp thư», «Chấm công»." },
        { text: "Các mục khác trên điện thoại (Điểm danh, Sổ đầu bài, Bảng điểm…) nằm trong mục xem thêm." },
        { text: "«Trang chủ» (hoặc «Hôm nay» trên điện thoại) cho biết hôm nay bạn dạy tiết nào, lớp nào." },
      ],
    },
    {
      id: "lich",
      title: "Xem lịch làm việc",
      steps: [
        { text: "Vào «Lịch làm việc». Lịch hiện các tiết bạn được xếp dạy." },
        { text: "Nhấn «Hôm nay» để quay về ngày hiện tại. Dùng nút trước/sau để đổi tuần." },
        { text: "Nhấn vào một tiết để xem lớp, phòng và giờ học." },
        { text: "Thấy lịch sai (thiếu tiết, sai lớp)? Báo phòng đào tạo sửa, vì giáo viên không tự đổi lịch được." },
      ],
    },
    {
      id: "cham-cong",
      title: "Chấm công",
      steps: [
        { text: "Vào «Chấm công» → «Chấm công hôm nay»." },
        { text: "Đến nơi làm việc, nhấn «Chấm vào». Khi về, nhấn «Chấm ra»." },
        {
          text: "Lần đầu, trình duyệt hỏi quyền dùng vị trí. Hãy chọn cho phép.",
          warning: "Nếu chặn vị trí, lượt chấm có thể bị đánh dấu ngoài vùng và phải chờ duyệt.",
        },
        { text: "Quên chấm hoặc chấm sai: vào «Đơn từ», nhấn «Tạo đơn mới», chọn loại đơn, ghi lý do rồi «Gửi giải trình»." },
        { text: "«Công của tôi»: xem công cả tháng." },
      ],
    },
    {
      id: "diem-danh",
      title: "Điểm danh và ghi sổ đầu bài",
      steps: [
        { text: "Vào «Điểm danh & KCT» (trên điện thoại: «Điểm danh»). Chọn ngày và tiết đang dạy.", note: "Chỉ hiện tiết có trong thời khoá biểu của bạn." },
        { text: "Mặc định mọi học sinh là «Có mặt». Đổi sang «Vắng P» (có phép), «Vắng K» (không phép) hoặc «Muộn» cho từng em." },
        { text: "Chọn bài dạy theo khung chương trình và ghi nhận xét tiết học." },
        { text: "Nhấn «Lưu điểm danh & ghi sổ»." },
        {
          text: "Mất mạng khi đang lưu? Tiết đó hiện «Offline · chờ đồng bộ». Không cần nhập lại; khi có mạng, máy tự gửi.",
          warning: "Đừng xoá dữ liệu trình duyệt hay đăng xuất khi còn tiết đang chờ gửi.",
        },
        { text: "Xem lại cả tuần ở «Sổ đầu bài». Có thể «In sổ» hoặc «Xuất Excel»." },
        { text: "Tháng đã chốt thì không sửa được nữa. Cần sửa, hãy báo phòng đào tạo." },
      ],
    },
    {
      id: "giao-bai",
      title: "Giao bài tập",
      steps: [
        { text: "Vào «Hoạt động học tập» → «Giao bài tập»." },
        { text: "Ở «Chọn bài tập», chọn môn, level và bài muốn giao." },
        { text: "Ở «Đối tượng giao bài», chọn «Giao theo lớp», «Giao theo khối» hoặc «Giao theo nhóm học tập», rồi tick lớp/nhóm." },
        { text: "Đặt «Ngày bắt đầu», «Ngày kết thúc», «Số lần làm» và «Thời gian tối đa»." },
        { text: "Kiểm tra lại rồi nhấn «Giao bài».", note: "Học sinh chỉ thấy bài khi tới «Ngày bắt đầu»." },
        { text: "Muốn chia lớp thành nhóm nhỏ: vào «Nhóm học sinh» trước khi giao." },
      ],
    },
    {
      id: "theo-doi",
      title: "Theo dõi lớp và điểm",
      steps: [
        { text: "«Tiến độ học tập»: xem em nào đã làm, chưa làm, nộp muộn." },
        { text: "«Bảng điểm»: điểm từng bài của cả lớp." },
        { text: "«Báo cáo lớp học» và «Thi đua»: tổng kết theo lớp." },
        { text: "«Thảo luận»: trả lời câu hỏi học sinh gửi qua nút «Hỏi cô»." },
      ],
    },
    {
      id: "tai-khoan-hoc-sinh",
      title: "Cấp lại mật khẩu cho học sinh",
      intro: "Học sinh quên mật khẩu sẽ hỏi giáo viên. Học sinh không tự lấy lại mật khẩu được.",
      steps: [
        { text: "Vào «Hoạt động học tập» → «Lớp học» và chọn lớp." },
        { text: "Tìm tên học sinh, nhấn «Cấp lại mật khẩu»." },
        { text: "Hộp «Cấp lại mật khẩu học sinh?» hiện ra. Xác nhận. Mật khẩu mới chính là tên đăng nhập của em đó." },
        { text: "Nhấn «Sao chép» rồi đưa mật khẩu mới cho đúng em đó.", warning: "Không gửi mật khẩu vào nhóm chat chung của lớp." },
        { text: "Em có thể tự đổi sang mật khẩu dễ nhớ hơn trong trang tài khoản của mình." },
      ],
    },
    installChapter([
      { text: "Điểm danh và sổ đầu bài vẫn lưu được khi mất mạng ngắn. Máy sẽ tự gửi khi có mạng lại." },
      { text: "Chấm công cần có mạng và vị trí, nên không chấm được khi offline." },
    ]),
  ],
};

export default teacherGuide;
