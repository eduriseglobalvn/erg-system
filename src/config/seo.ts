export const ERG_BRAND_NAME = "Trung Tam Ngoai Ngu Tin Hoc ERG";
export const ERG_BRAND_SUFFIX = "Trung Tam Ngoai Ngu - Tin Hoc ERG";

export const ERG_ASSETS = {
  logo: "https://media.erg.edu.vn/logo/erg.png",
  mobileLogo: "https://media.erg.edu.vn/logo/mobile-logo.png",
  favicon: "https://media.erg.edu.vn/logo/erg.png",
  appleTouchIcon: "/apple-touch-icon.png",
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
    title: `He thong on luyen truc tuyen MOS & IC3 | ${ERG_BRAND_SUFFIX}`,
    navName: "E-learning",
    description:
      "Nen tang hoc va thi thu truc tuyen chuan quoc te MOS, IC3 GS6 va IC3 Spark danh cho hoc sinh.",
    keywords: [
      "on thi IC3 GS6 online",
      "luyen thi IC3 Spark",
      "kiem tra tin hoc truc tuyen",
      "on tap MOS online",
      "he thong e-learning erg",
      "hoc tin hoc truc tuyen",
    ],
    ogImage: ERG_ASSETS.ogImage,
  },
} satisfies Record<"elearning", SiteSeo>;

const ELEARNING_ROUTE_TITLES: Record<string, string> = {
  "/": SEO_DATA.elearning.title,
  "/student": `Hoc sinh | ${SEO_DATA.elearning.title}`,
  "/dashboard": `Dashboard giao vien | ${SEO_DATA.elearning.title}`,
  "/question-types": `Demo dang cau hoi | ${SEO_DATA.elearning.title}`,
};

export function getSeoForLocation(hostname: string, pathname: string) {
  void hostname;
  const normalizedPathname = pathname || "/";
  const siteSeo = SEO_DATA.elearning;

  return {
    ...siteSeo,
    title: ELEARNING_ROUTE_TITLES[normalizedPathname] ?? siteSeo.title,
  };
}
