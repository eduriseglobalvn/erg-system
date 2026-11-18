import { installChapter } from "@/features/help/guides/install-chapter";
import type { HelpGuide } from "@/features/help/help-types";

const studentGuide: HelpGuide = {
  title: "Hướng dẫn cho học sinh",
  intro: "Em đọc từng bước dưới đây. Chỗ nào chưa rõ thì hỏi thầy cô nhé.",
  chapters: [
    {
      id: "bat-dau",
      title: "Bắt đầu",
      steps: [
        { text: "Mở trang đăng nhập ERG. Nhập tên đăng nhập và «Mật khẩu» thầy cô đưa cho em." },
        { text: "Nhấn «Đăng nhập». Em vào thẳng trang học, không cần làm thêm gì." },
        { text: "Quên mật khẩu? Em báo thầy cô phụ trách lớp. Thầy cô sẽ cấp lại mật khẩu cho em; mật khẩu mới chính là tên đăng nhập của em.", warning: "Nhập sai 5 lần liền thì phải chờ 15 phút mới thử lại được." },
        { text: "Không cho bạn khác biết mật khẩu của em." },
        { text: "Trên điện thoại, các mục nằm ở thanh dưới cùng. Trên máy tính, các mục nằm bên trái." },
      ],
    },
    {
      id: "lam-bai",
      title: "Làm bài tập",
      steps: [
        { text: "Vào «Bài tập». Mục «Cần làm» là bài em phải làm. Mục «Quá hạn» là bài đã hết hạn." },
        { text: "Xem «Hạn nộp» để biết cần làm xong trước ngày nào." },
        { text: "Nhấn vào bài, rồi nhấn «Bắt đầu làm bài»." },
        { text: "Làm lần lượt từng câu. Em có thể chuyển qua lại giữa các câu." },
        { text: "Làm xong, nhấn «Nộp bài».", note: "Bài có giới hạn thời gian sẽ tự nộp khi hết giờ." },
        { text: "Đang làm mà bị thoát ra? Mở lại bài và nhấn «Làm tiếp»." },
        { text: "Mất mạng giữa chừng? Đừng đóng trang. Chờ có mạng lại rồi làm tiếp và nộp bài.", warning: "Nếu đã hết giờ, bài sẽ được nộp với những câu em đã làm." },
      ],
    },
    {
      id: "xem-diem",
      title: "Xem điểm và xem lại bài",
      steps: [
        { text: "Vào «Điểm số» để xem điểm các bài đã nộp." },
        { text: "Bài đã nộp cũng nằm ở mục «Bài tập», thẻ «Đã nộp»." },
        { text: "Nhấn vào một bài, rồi nhấn «Xem bài làm» để xem câu đúng, câu sai." },
        { text: "Vào «Thi đua» để xem thứ hạng của em trong lớp." },
      ],
    },
    {
      id: "hoi-thay-co",
      title: "Hỏi thầy cô",
      steps: [
        { text: "Không hiểu một câu? Nhấn «Hỏi cô» trong bài." },
        { text: "Chọn bài và câu em muốn hỏi, rồi viết tin nhắn cho cô." },
        { text: "Vào «Thảo luận» để xem câu trả lời." },
        { text: "Vào «Hộp thư» để xem thông báo của trường và thầy cô." },
      ],
    },
    {
      id: "tai-khoan",
      title: "Tài khoản của em",
      steps: [
        { text: "Trên máy tính: nhấn «Tài khoản & cài đặt». Trên điện thoại: nhấn «Hồ sơ» ở thanh dưới cùng." },
        { text: "Ở đây em xem tên, lớp và mã đăng nhập. Sai thông tin thì báo giáo viên." },
        { text: "Em không tự đổi mật khẩu được. Quên mật khẩu thì báo giáo viên để được cấp lại." },
        { text: "Dùng máy của trường hoặc máy người khác thì nhớ đăng xuất khi học xong." },
      ],
    },
    installChapter([
      { text: "Cần có mạng để mở bài và nộp bài. Nếu mạng yếu, em chờ một chút rồi thử lại." },
    ]),
  ],
};

export default studentGuide;
