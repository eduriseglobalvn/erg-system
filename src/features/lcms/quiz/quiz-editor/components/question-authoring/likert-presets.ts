export type LikertPresetId = "agree" | "satisfied" | "frequency" | "custom";

export const LIKERT_PRESETS: ReadonlyArray<{ id: LikertPresetId; label: string }> = [
  { id: "agree", label: "Đồng ý" },
  { id: "satisfied", label: "Hài lòng" },
  { id: "frequency", label: "Mức độ thường xuyên" },
  { id: "custom", label: "Tự đặt" },
];

const LABELS: Record<Exclude<LikertPresetId, "custom">, Record<number, string[]>> = {
  agree: {
    2: ["Không đồng ý", "Đồng ý"],
    3: ["Không đồng ý", "Trung lập", "Đồng ý"],
    4: ["Rất không đồng ý", "Không đồng ý", "Đồng ý", "Rất đồng ý"],
    5: ["Rất không đồng ý", "Không đồng ý", "Trung lập", "Đồng ý", "Rất đồng ý"],
    6: ["Rất không đồng ý", "Không đồng ý", "Hơi không đồng ý", "Hơi đồng ý", "Đồng ý", "Rất đồng ý"],
    7: ["Rất không đồng ý", "Không đồng ý", "Hơi không đồng ý", "Trung lập", "Hơi đồng ý", "Đồng ý", "Rất đồng ý"],
  },
  satisfied: {
    2: ["Không hài lòng", "Hài lòng"],
    3: ["Không hài lòng", "Bình thường", "Hài lòng"],
    4: ["Rất không hài lòng", "Không hài lòng", "Hài lòng", "Rất hài lòng"],
    5: ["Rất không hài lòng", "Không hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"],
    6: ["Rất không hài lòng", "Không hài lòng", "Hơi không hài lòng", "Hơi hài lòng", "Hài lòng", "Rất hài lòng"],
    7: ["Rất không hài lòng", "Không hài lòng", "Hơi không hài lòng", "Bình thường", "Hơi hài lòng", "Hài lòng", "Rất hài lòng"],
  },
  frequency: {
    2: ["Không bao giờ", "Luôn luôn"],
    3: ["Không bao giờ", "Thỉnh thoảng", "Luôn luôn"],
    4: ["Không bao giờ", "Hiếm khi", "Thường xuyên", "Luôn luôn"],
    5: ["Không bao giờ", "Hiếm khi", "Thỉnh thoảng", "Thường xuyên", "Luôn luôn"],
    6: ["Không bao giờ", "Rất hiếm khi", "Hiếm khi", "Thỉnh thoảng", "Thường xuyên", "Luôn luôn"],
    7: ["Không bao giờ", "Rất hiếm khi", "Hiếm khi", "Thỉnh thoảng", "Thường xuyên", "Rất thường xuyên", "Luôn luôn"],
  },
};

/** count is 2..7. */
export function likertPresetLabels(preset: Exclude<LikertPresetId, "custom">, count: number): string[] {
  return [...LABELS[preset][count]];
}
