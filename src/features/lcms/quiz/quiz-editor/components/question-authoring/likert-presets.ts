import type { LikertScalePoint } from "@/domain/quiz/types";

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

/**
 * Keeps ids of retained positions; new points take the next unused `scale-n`; values are renumbered 1..count.
 * Only a preset clamps to 7: custom labels of old data with more levels shrink one level at a time.
 */
export function resizeLikertScale(scale: LikertScalePoint[], rawCount: number, preset: LikertPresetId): LikertScalePoint[] {
  const count = Math.max(2, preset === "custom" ? rawCount : Math.min(7, rawCount));
  const labels = preset === "custom" ? null : likertPresetLabels(preset, count);
  const used = new Set(scale.slice(0, count).map((p) => p.id));
  let n = 1;
  return Array.from({ length: count }, (_, i) => {
    let id = scale[i]?.id;
    if (!id) {
      while (used.has(`scale-${n}`)) n += 1;
      id = `scale-${n}`;
      used.add(id);
    }
    return { id, label: labels ? labels[i] : (scale[i]?.label ?? ""), value: i + 1 };
  });
}

/** The preset whose labels equal the scale's, else "custom". */
export function detectLikertPreset(scale: LikertScalePoint[]): LikertPresetId {
  const labels = scale.map((p) => p.label).join("|");
  const hit = LIKERT_PRESETS.find((p) => p.id !== "custom" && scale.length >= 2 && scale.length <= 7 && likertPresetLabels(p.id as Exclude<LikertPresetId, "custom">, scale.length).join("|") === labels);
  return hit?.id ?? "custom";
}
