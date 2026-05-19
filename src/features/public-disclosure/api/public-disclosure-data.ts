import type {
  DisclosureCategory,
  PublicDisclosureDocument,
  WatermarkConfig,
} from "@/features/public-disclosure/types/public-disclosure-types";

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  text: "ERG EDUCATION - VIEW ONLY",
  position: "center",
  offsetX: 0,
  offsetY: 0,
  opacity: 0.14,
  rotation: -28,
  scale: 1,
};

export const DISCLOSURE_CATEGORIES: DisclosureCategory[] = [
  {
    id: "license",
    title: "Giấy phép hoạt động",
    description: "Quyết định, giấy phép và hồ sơ pháp lý nền tảng.",
  },
  {
    id: "quality",
    title: "Cam kết chất lượng",
    description: "Thông tin chương trình, đội ngũ, cơ sở vật chất và chất lượng đào tạo.",
  },
  {
    id: "finance",
    title: "Học phí và chính sách tài chính",
    description: "Biểu phí, miễn giảm, hoàn phí và nghĩa vụ công khai tài chính.",
  },
  {
    id: "policy",
    title: "Quy chế và bảo vệ người học",
    description: "Quy định vận hành, quyền lợi học viên và chính sách an toàn.",
  },
];

export const PUBLIC_DISCLOSURE_DOCUMENTS: PublicDisclosureDocument[] = [
  {
    id: "license-2026",
    title: "Giấy chứng nhận đăng ký hoạt động giáo dục ERG",
    categoryId: "license",
    section: "Hồ sơ pháp lý",
    code: "ERG-LEGAL-2026-01",
    issuedBy: "Sở Giáo dục và Đào tạo",
    issuedAt: "12/01/2026",
    updatedAt: "22/04/2026",
    pageCount: 6,
    fileSize: "2.8 MB",
    status: "published",
    publicPath: "/cong-khai?document=license-2026",
    viewerPath: "/cong-khai/viewer/license-2026",
    description: "Tài liệu xác nhận tư cách pháp lý và phạm vi hoạt động đào tạo của ERG.",
    tags: ["pháp lý", "giấy phép", "đào tạo"],
  },
  {
    id: "quality-commitment",
    title: "Công khai cam kết chất lượng chương trình Tin học",
    categoryId: "quality",
    section: "Chất lượng đào tạo",
    code: "ERG-QLT-2026-04",
    issuedBy: "Ban học thuật ERG",
    issuedAt: "03/03/2026",
    updatedAt: "18/04/2026",
    pageCount: 9,
    fileSize: "4.1 MB",
    status: "published",
    publicPath: "/cong-khai?document=quality-commitment",
    viewerPath: "/cong-khai/viewer/quality-commitment",
    description: "Mục tiêu đầu ra, chuẩn đánh giá, điều kiện đảm bảo chất lượng và thông tin đội ngũ.",
    tags: ["chất lượng", "IC3", "chuẩn đầu ra"],
    watermark: {
      ...DEFAULT_WATERMARK_CONFIG,
      text: "ERG - PUBLIC DISCLOSURE",
      opacity: 0.12,
      rotation: -24,
    },
  },
  {
    id: "tuition-policy",
    title: "Biểu phí và chính sách hoàn phí năm học 2026",
    categoryId: "finance",
    section: "Học phí",
    code: "ERG-FIN-2026-02",
    issuedBy: "Phòng vận hành ERG",
    issuedAt: "20/02/2026",
    updatedAt: "14/04/2026",
    pageCount: 5,
    fileSize: "1.9 MB",
    status: "review",
    publicPath: "/cong-khai?document=tuition-policy",
    viewerPath: "/cong-khai/viewer/tuition-policy",
    description: "Thông tin học phí, ưu đãi, kỳ thanh toán, bảo lưu và hoàn phí.",
    tags: ["học phí", "hoàn phí", "tài chính"],
  },
  {
    id: "learner-safety",
    title: "Quy chế bảo vệ học viên và xử lý phản ánh",
    categoryId: "policy",
    section: "Bảo vệ người học",
    code: "ERG-POL-2026-03",
    issuedBy: "Ban điều hành ERG",
    issuedAt: "09/02/2026",
    updatedAt: "09/04/2026",
    pageCount: 7,
    fileSize: "2.5 MB",
    status: "published",
    publicPath: "/cong-khai?document=learner-safety",
    viewerPath: "/cong-khai/viewer/learner-safety",
    description: "Quy trình tiếp nhận phản ánh, xử lý sự cố và bảo vệ quyền lợi học viên.",
    tags: ["quy chế", "an toàn", "phản ánh"],
  },
];

export function getDisclosureDocument(documentId?: string | null) {
  return (
    PUBLIC_DISCLOSURE_DOCUMENTS.find((document) => document.id === documentId) ??
    PUBLIC_DISCLOSURE_DOCUMENTS[0]
  );
}

export function getDocumentWatermark(document: PublicDisclosureDocument) {
  return document.watermark ?? DEFAULT_WATERMARK_CONFIG;
}
