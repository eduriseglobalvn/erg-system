export const ERG_BRAND_NAME = "Trung Tâm Ngoại Ngữ Tin Học ERG";
export const ERG_BRAND_SUFFIX = "Trung Tâm Ngoại Ngữ - Tin Học ERG";

export const ERG_ASSETS = {
  logo: "https://media.erg.edu.vn/logo/erg.png",
  favicon: "https://media.erg.edu.vn/logo/erg.png",
  ogImage: "https://media.erg.edu.vn/logo/og-image.jpg",
};

export type SiteSeo = {
  title: string;
  navName: string;
  description: string;
  keywords: string[];
  ogImage: string;
};

export const SEO_DATA = {
  elearning: {
    title: `Hệ thống ôn luyện trực tuyến MOS & IC3 | ${ERG_BRAND_SUFFIX}`,
    navName: "E-learning",
    description:
      "Nền tảng học và thi thử trực tuyến chuẩn quốc tế MOS, IC3 GS6 và IC3 Spark dành cho học sinh. Hệ thống bài tập đa dạng, bám sát đề thi thực tế.",
    keywords: [
      "ôn thi IC3 GS6 online",
      "luyện thi IC3 Spark",
      "kiểm tra tin học trực tuyến",
      "ôn tập MOS online",
      "hệ thống e-learning erg",
      "học tin học trực tuyến",
      "bài tập tin học 6",
      "ôn thi tin học tiểu học",
      "phần mềm luyện thi ic3 gs6",
      "thi thử mos excel",
      "đề thi ic3 spark có đáp án",
      "luyện thi tin học erg",
    ],
    ogImage: ERG_ASSETS.ogImage,
  },
  hoclieu: {
    title: `Học liệu giáo viên ERG | ${ERG_BRAND_SUFFIX}`,
    navName: "Teacher Hub",
    description:
      "Cổng học liệu nội bộ dành cho giáo viên ERG: giáo án, slide, quiz, portfolio bài giảng và tài nguyên triển khai lớp học.",
    keywords: [
      "học liệu giáo viên ERG",
      "teacher hub ERG",
      "giáo án IC3 GS6",
      "giáo án MOS",
      "kho học liệu ERG",
      "bài giảng tin học ERG",
      "quiz bank ERG",
      "tài liệu giảng dạy tin học",
    ],
    ogImage: ERG_ASSETS.ogImage,
  },
} satisfies Record<"elearning" | "hoclieu", SiteSeo>;

const ELEARNING_ROUTE_TITLES: Record<string, string> = {
  "/": SEO_DATA.elearning.title,
  "/student": `Học sinh | ${SEO_DATA.elearning.title}`,
  "/dashboard": `Dashboard giáo viên | ${SEO_DATA.elearning.title}`,
  "/question-types": `Demo dạng câu hỏi | ${SEO_DATA.elearning.title}`,
};

const HOCLIEU_ROUTE_TITLES: Record<string, string> = {
  "/": SEO_DATA.hoclieu.title,
  "/hoclieu": SEO_DATA.hoclieu.title,
  "/chuong-trinh": `Chương trình | ${SEO_DATA.hoclieu.title}`,
  "/kho-hoc-lieu": `Kho học liệu | ${SEO_DATA.hoclieu.title}`,
  "/cong-dong": `Cộng đồng giáo viên | ${SEO_DATA.hoclieu.title}`,
  "/portfolio": `Portfolio bài giảng | ${SEO_DATA.hoclieu.title}`,
  "/quizzes": `Quiz bank | ${SEO_DATA.hoclieu.title}`,
};

export function getSeoForLocation(hostname: string, pathname: string) {
  const normalizedHostname = hostname.toLowerCase();
  const normalizedPathname = pathname || "/";
  const isHocLieuHost = normalizedHostname.startsWith("hoclieu.");
  const siteSeo = isHocLieuHost || normalizedPathname.startsWith("/hoclieu")
    ? SEO_DATA.hoclieu
    : SEO_DATA.elearning;
  const titleMap = siteSeo === SEO_DATA.hoclieu ? HOCLIEU_ROUTE_TITLES : ELEARNING_ROUTE_TITLES;

  return {
    ...siteSeo,
    title:
      titleMap[normalizedPathname] ??
      (normalizedPathname.startsWith("/chuong-trinh/")
        ? `Chi tiết chương trình | ${SEO_DATA.hoclieu.title}`
        : siteSeo.title),
  };
}
