import { installChapter } from "@/features/help/guides/install-chapter";
import type { HelpGuide } from "@/features/help/help-types";

const adminGuide: HelpGuide = {
  title: "Hướng dẫn cho quản trị và phòng đào tạo",
  intro: "Các bước dưới đây đi theo thứ tự công việc: tạo trường, nhập học sinh, tạo tài khoản nhân sự, xếp lịch, theo dõi và duyệt chấm công.",
  chapters: [
    {
      id: "bat-dau",
      title: "Bắt đầu",
      steps: [
        { text: "Mở trang đăng nhập ERG. Nhập tài khoản và «Mật khẩu», rồi nhấn «Đăng nhập»." },
        { text: "Chỉ tick «Ghi nhớ đăng nhập» trên máy của riêng bạn.", warning: "Máy dùng chung thì không tick, và nhớ đăng xuất khi xong việc." },
        {
          text: "Quên mật khẩu: nhấn «Quên mật khẩu?» và làm theo hướng dẫn trên màn hình. Thường bạn cần liên hệ quản trị viên ERG để được cấp lại.",
          note: "Nhập sai mật khẩu 5 lần liền thì tài khoản bị tạm khoá 15 phút.",
        },
        { text: "Sau khi vào, menu nằm bên trái. Trên điện thoại, nhấn biểu tượng menu ở góc trên để mở." },
        { text: "«Trang chủ» có các việc cần làm hôm nay và nút tắt «Thêm trường», «Tạo tài khoản nhân sự»." },
        { text: "Phòng đào tạo dùng chung cổng này. Bạn chỉ thấy những mục được cấp quyền.", note: "Thiếu mục nào, hãy báo người quản trị cấp thêm quyền trong «Vai trò & quyền»." },
      ],
    },
    {
      id: "truong-hoc",
      title: "Tạo trường học",
      steps: [
        { text: "Vào «Quản lý trường học» → «Danh sách trường»." },
        { text: "Nhấn «Thêm trường». Điền tên trường và các thông tin bắt buộc, rồi lưu." },
        { text: "Nhấn vào một trường trong danh sách để xem và sửa thông tin của trường." },
        { text: "Kiểm tra lại tên trường trước khi nhập học sinh, vì danh sách lớp sẽ gắn vào trường này." },
      ],
    },
    {
      id: "nhap-hoc-sinh",
      title: "Nhập danh sách học sinh",
      intro: "Có hai cách: chọn file Excel/CSV, hoặc dán đường dẫn Google Sheet.",
      steps: [
        { text: "Vào «Quản lý trường học» → «Người học», chọn trường." },
        { text: "Cách 1 – file: nhấn «Import danh sách lớp», rồi «Chọn file lớp». Chấp nhận file .xlsx, .xls hoặc .csv." },
        { text: "Cách 2 – Google Sheet: chọn «Nhập học sinh từ Google Sheet». Dán «Đường dẫn Google Sheets» và chọn «Tab Sheet cần đọc».", note: "Sheet phải được chia sẻ cho người có đường dẫn xem được." },
        { text: "Xem «Bảng xem trước dữ liệu học sinh». Dòng có nhãn «Cần kiểm tra» là dòng bị thiếu hoặc sai thông tin." },
        { text: "Sửa ngay trên bảng xem trước (họ tên, lớp, ngày sinh…). Lỗi nhiều thì sửa file gốc rồi nhập lại. Khi không còn lỗi, nhấn «Xác nhận lưu»." },
        { text: "Chỉ có vài học sinh? Dùng «Tạo một lớp thủ công» thay vì nhập file." },
        { text: "Sau khi lưu, xem lại ở «Người học theo khối/lớp».", warning: "Không nhập cùng một file hai lần. Nếu lỡ nhập, kiểm tra học sinh bị trùng trước khi giao bài." },
      ],
    },
    {
      id: "nhan-su",
      title: "Tài khoản nhân sự và quyền",
      steps: [
        { text: "Vào «Nhân sự» → «Tài khoản nhân sự»." },
        { text: "Nhấn «Tạo tài khoản nhân sự». Điền «Họ và tên», «Mã nhân viên», «Phòng ban», «Chức danh»… rồi lưu." },
        { text: "Mở một người trong danh sách để xem hồ sơ. Ở thẻ vai trò, dùng «Gán nhóm quyền» để chọn quyền cho người đó." },
        { text: "Người nghỉ việc: dùng «Khoá tài khoản». Khi cần mở lại: «Mở khoá tài khoản».", note: "Khoá thay vì xoá để giữ lại lịch sử dạy và chấm công." },
        { text: "«Nhật ký truy cập» cho biết ai đăng nhập khi nào và từ đâu." },
        { text: "Muốn đổi những gì một nhóm quyền được làm: vào «Quyền & nhật ký» → «Vai trò & quyền».", warning: "Đổi nhóm quyền ảnh hưởng tới mọi người trong nhóm đó." },
      ],
    },
    {
      id: "lich-giang-day",
      title: "Lịch trung tâm và báo giảng",
      steps: [
        { text: "Vào «Lịch trung tâm» để xem lịch dạy của tất cả giáo viên." },
        { text: "Dùng ô lọc giáo viên để chỉ xem lịch của một người." },
        { text: "Khi hai tiết bị trùng giờ hoặc trùng giáo viên, lịch sẽ báo. Sửa tiết đó trước khi lưu." },
        { text: "Ở thanh bên trái, bấm «Báo giảng» để xem giáo viên đã báo giảng và ghi sổ đầu bài chưa." },
      ],
    },
    {
      id: "giam-sat",
      title: "Theo dõi việc học",
      steps: [
        { text: "«Giám sát đào tạo»: xem tiến độ học và làm bài theo trường, khối, lớp." },
        { text: "«Kiểm tra & câu hỏi»: xem các bài kiểm tra và ngân hàng câu hỏi." },
        { text: "«Thi đua», «Thảo luận», «Chuẩn đầu ra» ở thanh bên trái: xem hoạt động của lớp." },
        { text: "«Nhật ký hoạt động»: ai đã sửa gì trong dữ liệu trường học." },
      ],
    },
    {
      id: "cham-cong",
      title: "Chấm công",
      steps: [
        { text: "«Chấm công» → «Hôm nay»: ai đã chấm vào, chấm ra trong ngày." },
        { text: "Lượt chấm có nhãn như «Chấm ngoài vùng 180 m» cần bạn xem lại và quyết định." },
        { text: "«Duyệt đơn»: mở từng đơn, đọc lý do, rồi nhấn «Duyệt» hoặc «Từ chối»." },
        { text: "«Bảng công» và «Công tiết dạy»: xem tổng công theo tháng. Có thể «Xuất Excel»." },
        { text: "«Cấu hình chấm công»: ca làm, vùng chấm công, ngày nghỉ (nút «Thêm ngày nghỉ»).", warning: "Sửa cấu hình ảnh hưởng tới cả trung tâm. Chỉ người phụ trách mới nên sửa." },
      ],
    },
    installChapter([
      { text: "Trang quản trị cần có mạng. Khi mất mạng, thanh trên cùng sẽ báo đang offline. Chờ có mạng lại rồi mới lưu." },
    ]),
  ],
};

export default adminGuide;
