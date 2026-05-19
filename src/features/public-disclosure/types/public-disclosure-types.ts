export type DisclosureCategoryId =
  | "license"
  | "quality"
  | "finance"
  | "policy";

export type DisclosureStatus = "published" | "draft" | "review";

export type WatermarkPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type WatermarkConfig = {
  text: string;
  position: WatermarkPosition;
  offsetX: number;
  offsetY: number;
  opacity: number;
  rotation: number;
  scale: number;
};

export type PublicDisclosureDocument = {
  id: string;
  title: string;
  categoryId: DisclosureCategoryId;
  section: string;
  code: string;
  issuedBy: string;
  issuedAt: string;
  updatedAt: string;
  pageCount: number;
  fileSize: string;
  status: DisclosureStatus;
  publicPath: string;
  viewerPath: string;
  description: string;
  tags: string[];
  watermark?: WatermarkConfig;
};

export type DisclosureCategory = {
  id: DisclosureCategoryId;
  title: string;
  description: string;
};
