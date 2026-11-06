import { apiRequest } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

export type CurriculumLevelCatalogItem = {
  id: string;
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
};

export type CurriculumSubjectCatalogItem = {
  id: string;
  code: string;
  name: string;
  category?: string;
  description?: string;
  levels: CurriculumLevelCatalogItem[];
};

export const DEFAULT_CURRICULUM_CATALOG: CurriculumSubjectCatalogItem[] = [
  {
    id: "sub_ic3",
    code: "ic3-digital-literacy",
    name: "IC3 Digital Literacy",
    category: "Công nghệ số quốc tế",
    description: "Tiêu chuẩn quốc tế về năng lực sử dụng máy tính và internet",
    levels: [
      { id: "lvl_ic3_gs6_l1", code: "ic3-gs6-level-1", name: "IC3 GS6 Level 1", description: "Nền tảng công nghệ số & máy tính", sortOrder: 1 },
      { id: "lvl_ic3_gs6_l2", code: "ic3-gs6-level-2", name: "IC3 GS6 Level 2", description: "Các ứng dụng then chốt & văn phòng", sortOrder: 2 },
      { id: "lvl_ic3_gs6_l3", code: "ic3-gs6-level-3", name: "IC3 GS6 Level 3", description: "Cuộc sống trực tuyến & bảo mật số", sortOrder: 3 },
    ],
  },
  {
    id: "sub_tin_hoc",
    code: "tin-hoc",
    name: "Tin học",
    category: "Chương trình phổ thông",
    description: "Chương trình Tin học GDPT 2018 Bộ Giáo dục & Đào tạo",
    levels: [
      { id: "lvl_tin_hoc_6", code: "tin-hoc-6", name: "Tin học 6", description: "Tin học Khối 6", sortOrder: 1 },
      { id: "lvl_tin_hoc_7", code: "tin-hoc-7", name: "Tin học 7", description: "Tin học Khối 7", sortOrder: 2 },
      { id: "lvl_tin_hoc_8", code: "tin-hoc-8", name: "Tin học 8", description: "Tin học Khối 8", sortOrder: 3 },
      { id: "lvl_tin_hoc_9", code: "tin-hoc-9", name: "Tin học 9", description: "Tin học Khối 9", sortOrder: 4 },
    ],
  },
  {
    id: "sub_mos",
    code: "mos",
    name: "MOS (Microsoft Office Specialist)",
    category: "Tin học văn phòng quốc tế",
    description: "Chứng chỉ tin học văn phòng chuẩn quốc tế của Microsoft",
    levels: [
      { id: "lvl_mos_word", code: "mos-word", name: "MOS Word", description: "Xử lý văn bản chuyên nghiệp", sortOrder: 1 },
      { id: "lvl_mos_excel", code: "mos-excel", name: "MOS Excel", description: "Xử lý bảng tính & dữ liệu số", sortOrder: 2 },
      { id: "lvl_mos_powerpoint", code: "mos-powerpoint", name: "MOS PowerPoint", description: "Thiết kế bài thuyết trình chuyên nghiệp", sortOrder: 3 },
    ],
  },
  {
    id: "sub_python",
    code: "python",
    name: "Lập trình Python",
    category: "Khoa học máy tính",
    description: "Lập trình tư duy logic và khoa học dữ liệu với Python",
    levels: [
      { id: "lvl_python_foundation", code: "python-foundation", name: "Python Foundation", description: "Nền tảng cú pháp và thuật toán cơ bản", sortOrder: 1 },
      { id: "lvl_python_intermediate", code: "python-intermediate", name: "Python Intermediate", description: "Lập trình nâng cao và cấu trúc dữ liệu", sortOrder: 2 },
    ],
  },
  {
    id: "sub_ai",
    code: "ai",
    name: "Trí tuệ nhân tạo (AI)",
    category: "Công nghệ tiên tiến",
    description: "Nhập môn AI, thị giác máy tính và ứng dụng máy học",
    levels: [
      { id: "lvl_ai_coban", code: "co-ban", name: "AI Cơ bản", description: "Làm quen tư duy máy học và nhận diện hình ảnh", sortOrder: 1 },
      { id: "lvl_ai_nangcao", code: "nang-cao", name: "AI Nâng cao", description: "Xây dựng mô hình máy học và ứng dụng AI", sortOrder: 2 },
    ],
  },
  {
    id: "sub_toan",
    code: "toan",
    name: "Toán học",
    category: "Môn văn hóa",
    description: "Chương trình Toán học phổ thông",
    levels: [
      { id: "lvl_toan_cb", code: "co-ban", name: "Toán Cơ Bản", description: "Kiến thức trọng tâm chuẩn Bộ GD&ĐT", sortOrder: 1 },
      { id: "lvl_toan_nc", code: "nang-cao", name: "Toán Nâng Cao", description: "Bồi dưỡng học sinh giỏi & chuyên sâu", sortOrder: 2 },
    ],
  },
  {
    id: "sub_tieng_anh",
    code: "tieng-anh",
    name: "Tiếng Anh",
    category: "Ngoại ngữ",
    description: "Ngoại ngữ và giao tiếp quốc tế",
    levels: [
      { id: "lvl_eng_cb", code: "tieng-anh-co-ban", name: "Tiếng Anh Cơ Bản", description: "Chương trình chuẩn Bộ GD&ĐT", sortOrder: 1 },
      { id: "lvl_eng_tc", code: "tieng-anh-tang-cuong", name: "Tiếng Anh Tăng Cường", description: "Tiếng Anh tăng cường & định hướng Cambridge", sortOrder: 2 },
    ],
  },
  {
    id: "sub_ngu_van",
    code: "ngu-van",
    name: "Ngữ Văn",
    category: "Môn văn hóa",
    description: "Đọc hiểu văn bản và rèn luyện kỹ năng ngôn ngữ",
    levels: [
      { id: "lvl_van_cb", code: "co-ban", name: "Văn Cơ Bản", description: "Chuẩn kiến thức kỹ năng Bộ GD&ĐT", sortOrder: 1 },
    ],
  },
];

type ApiCurriculumTree = {
  subjects?: Array<{
    subject?: { id?: string; code?: string; name?: string; description?: string };
    levels?: Array<{
      level?: { id?: string; code?: string; name?: string; description?: string; sortOrder?: number };
    }>;
  }>;
};

export async function fetchCurriculumCatalog(signal?: AbortSignal): Promise<CurriculumSubjectCatalogItem[]> {
  try {
    const res = await apiRequest<ApiCurriculumTree>(API_ENDPOINTS.curriculum.activeTree, { signal });
    if (res && Array.isArray(res.subjects)) {
      const results: CurriculumSubjectCatalogItem[] = [];

      for (const item of res.subjects) {
        const s = item.subject;
        if (!s?.id || !s.name) continue;

        const levels: CurriculumLevelCatalogItem[] = [];
        for (const lvl of item.levels || []) {
          const l = lvl.level;
          if (!l?.id || !l.name) continue;
          levels.push({
            id: l.id,
            code: l.code || l.id,
            name: l.name,
            description: l.description,
            sortOrder: l.sortOrder ?? 0,
          });
        }

        const fallback = DEFAULT_CURRICULUM_CATALOG.find((def) => def.code === s.code || def.id === s.id);
        const finalLevels = levels.length > 0 ? levels : (fallback?.levels ?? []);

        results.push({
          id: s.id,
          code: s.code || s.id,
          name: s.name,
          description: s.description,
          levels: finalLevels,
        });
      }

      return results;
    }
  } catch {
    // Graceful fallback to rich local catalog
  }
  return DEFAULT_CURRICULUM_CATALOG;
}
