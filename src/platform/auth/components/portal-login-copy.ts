import type { ElementType } from "react";
import BarChart3 from "@mui/icons-material/BarChartRounded";
import BookOpenCheck from "@mui/icons-material/MenuBookRounded";
import ClipboardCheck from "@mui/icons-material/FactCheckRounded";
import GraduationCap from "@mui/icons-material/SchoolRounded";
import KeyRound from "@mui/icons-material/KeyRounded";
import LibraryBig from "@mui/icons-material/LocalLibraryRounded";
import Presentation from "@mui/icons-material/PresentToAllRounded";
import School from "@mui/icons-material/School";
import ShieldCheck from "@mui/icons-material/VerifiedUserRounded";

import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";

export type PortalKey = NonNullable<StoredAuthSession["portal"]>;

type PortalVisualItem = { label: string; caption: string; icon: ElementType };
type PortalMetric = { label: string; value: string; icon: ElementType };

export type PortalLoginCopy = {
  badge: string;
  mobileLabel: string;
  title: string;
  description: string;
  formTitle: string;
  formSubtitle: string;
  formFootnote?: string;
  credentialLabel: string;
  credentialPlaceholder: string;
  allowGoogle: boolean;
  allowRegister: boolean;
  visualKicker: string;
  visualTitle: string;
  visualDescription: string;
  trustItems: PortalVisualItem[];
  metrics: PortalMetric[];
};

export function getPortalLoginCopy(portal: PortalKey): PortalLoginCopy {
  if (portal === "admin" || portal === "crm") {
    return {
      badge: "CRM Portal", mobileLabel: "Quản trị ERG", title: "Quản trị hệ thống ERG",
      description: "Đăng nhập tài khoản quản trị để quản lý dữ liệu nguồn, trường/trung tâm, tài khoản, câu hỏi, quiz bank và học liệu xuất bản.",
      formTitle: "Đăng nhập CRM", formSubtitle: "Chỉ dành cho quản trị viên hệ thống hoặc tài khoản được cấp quyền CRM.",
      formFootnote: "Tài khoản giáo viên thường không thể vào CRM. Nếu cần quyền quản trị, vui lòng liên hệ quản trị viên ERG.",
      credentialLabel: "Email quản trị", credentialPlaceholder: "admin@erg.edu.vn", allowGoogle: true, allowRegister: false,
      visualKicker: "System back office", visualTitle: "Một nơi quản lý dữ liệu nguồn, phân quyền và xuất bản học liệu cho toàn hệ thống.",
      visualDescription: "CRM tách khỏi workflow giáo viên để tránh lẫn thao tác dạy học hằng ngày với quản trị dữ liệu nguồn.",
      trustItems: [
        { label: "Phân quyền chặt", caption: "CRM-only", icon: KeyRound },
        { label: "Dữ liệu nguồn", caption: "Câu hỏi, quiz, học liệu", icon: ShieldCheck },
        { label: "Quản lý hệ thống", caption: "Trường, lớp, tài khoản", icon: BarChart3 },
      ],
      metrics: [
        { label: "Câu hỏi", value: "Bank", icon: ClipboardCheck },
        { label: "Học liệu", value: "Publish", icon: LibraryBig },
        { label: "Tài khoản", value: "ACL", icon: School },
      ],
    };
  }
  if (portal === "elearning") {
    return {
      badge: "Student Workspace", mobileLabel: "Cổng học sinh ERG", title: "Cổng bài tập học sinh",
      description: "Đăng nhập bằng tài khoản học sinh được ERG cấp để làm bài, xem tiến độ và tiếp tục lớp học trực tuyến.",
      formTitle: "Đăng nhập Student Workspace", formSubtitle: "Chỉ sử dụng tài khoản học sinh do ERG hoặc nhà trường cấp.",
      formFootnote: "Tài khoản học sinh chỉ có quyền vào Student Workspace. Nếu quên mật khẩu, vui lòng liên hệ giáo viên phụ trách hoặc quản trị viên trường.",
      credentialLabel: "Mã học sinh hoặc email", credentialPlaceholder: "Ví dụ: HS001 hoặc email ERG", allowGoogle: false, allowRegister: false,
      visualKicker: "Student workspace", visualTitle: "Một nơi để học sinh nhận bài, làm bài và theo dõi tiến độ.",
      visualDescription: "Student Workspace tập trung vào trải nghiệm học sinh: ít thao tác, vào lớp nhanh và không lẫn với khu quản trị giáo viên.",
      trustItems: [
        { label: "Tài khoản được cấp", caption: "Không tự đăng ký", icon: KeyRound },
        { label: "Chỉ vào Student Workspace", caption: "Đúng quyền học sinh", icon: ShieldCheck },
        { label: "Theo dõi tiến độ", caption: "Bài tập và kết quả", icon: BarChart3 },
      ],
      metrics: [
        { label: "Bài tập", value: "Làm bài", icon: ClipboardCheck },
        { label: "Lớp học", value: "Theo lớp", icon: School },
        { label: "Tiến độ", value: "Cá nhân", icon: BookOpenCheck },
      ],
    };
  }
  if (portal === "lcms") {
    return {
      badge: "Admin", mobileLabel: "Admin ERG", title: "Quản trị nội dung học tập",
      description: "Đăng nhập tài khoản được cấp quyền để quản lý ngân hàng câu hỏi, quiz bank, học liệu, taxonomy và xuất bản nội dung cho LMS.",
      formTitle: "Đăng nhập Admin", formSubtitle: "Dành cho đội vận hành nội dung, học liệu và quản trị viên được cấp quyền.",
      formFootnote: "Admin quản lý nội dung, người dùng và cấu hình vận hành; quyền cụ thể do backend cấp.",
      credentialLabel: "Email nội bộ", credentialPlaceholder: "admin@erg.edu.vn", allowGoogle: true, allowRegister: false,
      visualKicker: "Learning content management", visualTitle: "Một nơi quản trị nội dung nguồn trước khi đưa sang lớp học.",
      visualDescription: "Admin tập trung vào biên soạn, phân loại, kiểm duyệt và xuất bản nội dung học tập; không phải CRM và cũng không phải kho mở tài liệu của giáo viên.",
      trustItems: [
        { label: "Nội dung nguồn", caption: "Question, quiz, học liệu", icon: LibraryBig },
        { label: "Xuất bản có kiểm soát", caption: "Metadata, taxonomy", icon: ShieldCheck },
        { label: "Dùng quyền LMS", caption: "Không tách account", icon: KeyRound },
      ],
      metrics: [
        { label: "Câu hỏi", value: "Bank", icon: ClipboardCheck },
        { label: "Quiz", value: "Author", icon: Presentation },
        { label: "Học liệu", value: "Publish", icon: LibraryBig },
      ],
    };
  }
  return {
    badge: "LMS Portal", mobileLabel: "LMS giáo viên ERG", title: "Quản lý lớp học ERG",
    description: "Đăng nhập tài khoản giáo viên để quản lý lớp, theo dõi học sinh, xem báo cáo và điều phối hoạt động học tập.",
    formTitle: "Đăng nhập LMS", formSubtitle: "Dành cho giáo viên, điều phối viên và quản trị viên được cấp quyền.",
    formFootnote: "Quyền truy cập LMS được cấp theo vai trò và trường phụ trách. Tài khoản không đúng quyền sẽ không vào được hệ thống.",
    credentialLabel: "Email nội bộ", credentialPlaceholder: "teacher@erg.edu.vn", allowGoogle: true, allowRegister: false,
    visualKicker: "Teacher operations", visualTitle: "Một bảng điều khiển cho lớp học, học sinh và báo cáo vận hành.",
    visualDescription: "LMS là khu làm việc của giáo viên: quản lý lớp, theo dõi tiến độ, xem dữ liệu học tập và phối hợp với trường.",
    trustItems: [
      { label: "Phân quyền vai trò", caption: "Giáo viên, admin", icon: KeyRound },
      { label: "Theo trường phụ trách", caption: "Không lẫn dữ liệu", icon: School },
      { label: "Báo cáo học tập", caption: "Theo dõi kết quả", icon: BarChart3 },
    ],
    metrics: [
      { label: "Lớp học", value: "Quản lý", icon: School },
      { label: "Học sinh", value: "Theo dõi", icon: GraduationCap },
      { label: "Báo cáo", value: "Dữ liệu", icon: BarChart3 },
    ],
  };
}
