import type { HelpChapter, HelpStep } from "@/features/help/help-types";

/** «Cài ứng dụng» chapter shared by every portal; `offline` is the portal's own line about working without network. */
export function installChapter(offline: HelpStep[]): HelpChapter {
  return {
    id: "cai-ung-dung",
    title: "Cài ứng dụng lên điện thoại/máy tính",
    intro: "ERG chạy trên trình duyệt. Cài lên màn hình chính để mở nhanh như một ứng dụng. Không cần tải từ kho ứng dụng.",
    steps: [
      { text: "Android (Chrome): mở trang ERG bằng Chrome và đăng nhập." },
      { text: "Android: nhấn menu ⋮ ở góc trên bên phải của Chrome." },
      {
        text: "Android: chọn «Cài đặt ứng dụng» (hoặc «Thêm vào màn hình chính»), rồi nhấn «Cài đặt».",
        note: "Khi hiện dải «Cài ERG lên màn hình chính» ở cuối trang, bạn có thể nhấn vào đó để cài luôn.",
      },
      {
        text: "iPhone/iPad (Safari): mở trang ERG bằng Safari. Máy cũ như iPhone 7 (iOS 15) vẫn cài được.",
        warning: "Chỉ Safari mới cài được. Nếu bạn mở link trong Zalo hoặc Facebook, hãy chép link và dán vào Safari trước.",
      },
      { text: "iPhone/iPad: nhấn nút «Chia sẻ» (hình vuông có mũi tên lên) ở thanh dưới hoặc thanh địa chỉ." },
      { text: "iPhone/iPad: kéo xuống, chọn «Thêm vào MH chính», rồi nhấn «Thêm» ở góc trên bên phải." },
      { text: "Máy tính Windows hoặc macOS (Chrome, Edge): mở trang ERG và đăng nhập." },
      {
        text: "Máy tính: nhấn biểu tượng «Cài đặt» ở cuối thanh địa chỉ. Hoặc mở menu ⋮ (Edge: ⋯) và chọn «Cài đặt ứng dụng...».",
        note: "Trong ERG, menu tài khoản cũng có mục «Cài đặt ứng dụng ERG».",
      },
      { text: "Sau khi cài, mở ERG từ biểu tượng mới trên màn hình chính hoặc trên máy tính. Lần đầu vẫn cần đăng nhập." },
      ...offline,
    ],
  };
}
