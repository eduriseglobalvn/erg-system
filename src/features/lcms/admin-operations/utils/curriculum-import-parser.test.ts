import { describe, expect, it } from "vitest";
import { parseCurriculumPastedText } from "./curriculum-import-parser";

describe("parseCurriculumPastedText", () => {
  it("parses 3-column tab-delimited Excel paste with merged topic cells", () => {
    const raw = `Chủ đề\tTiết\tTên bài học
Căn bản về công nghệ\t1\tBài 1: Xác định yêu cầu hệ thống và yêu cầu phần mềm
\t2\tBài 1: Xác định yêu cầu hệ thống và yêu cầu phần mềm
\t3\tBài 2: Khắc phục sự cố máy tính
\t4\tBài 2: Khắc phục sự cố máy tính
\t5\tBài 3: Cấp phép phần mềm
\t6\tBài 4: Cài đặt mặc định phần mềm
\t7\tÔn tập 1
Công dân số\t8\tBài 5: Báo cáo hành vi gây hại (1)
\t9\tBài 6: Báo cáo hành vi gây hại (2)
\t14\tÔn tập 2`;

    const result = parseCurriculumPastedText(raw);
    expect(result.rows).toHaveLength(10);
    expect(result.rows[0]).toEqual({
      topic: "Căn bản về công nghệ",
      period: 1,
      title: "Bài 1: Xác định yêu cầu hệ thống và yêu cầu phần mềm",
      sessions: 1,
      isReview: false,
      isPractice: false,
    });
    // Merged cell inheritance
    expect(result.rows[1].topic).toBe("Căn bản về công nghệ");
    expect(result.rows[1].period).toBe(2);

    // Ôn tập detection
    expect(result.rows[6].title).toBe("Ôn tập 1");
    expect(result.rows[6].isReview).toBe(true);

    // Topic switch
    expect(result.rows[7].topic).toBe("Công dân số");
    expect(result.rows[7].period).toBe(8);

    expect(result.stats.totalTopics).toBe(2);
    expect(result.stats.reviewCount).toBe(2);
  });

  it("handles enrichment and exam practice sections", () => {
    const raw = `Tăng cường\t51\tÔn tập
\t52\tÔn tập
\t58\tLuyện thi
\t59\tLuyện thi`;

    const result = parseCurriculumPastedText(raw);
    expect(result.rows).toHaveLength(4);
    expect(result.rows[0].isReview).toBe(true);
    expect(result.rows[2].isPractice).toBe(true);
    expect(result.stats.practiceCount).toBe(2);
  });

  it("handles 2-column format without period column", () => {
    const raw = `Chủ đề\tTên bài học
Toán 1\tBài 1
\tBài 2
Toán 2\tBài 3`;

    const result = parseCurriculumPastedText(raw);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].period).toBe(1);
    expect(result.rows[1].period).toBe(2);
    expect(result.rows[2].period).toBe(3);
    expect(result.rows[1].topic).toBe("Toán 1");
    expect(result.rows[2].topic).toBe("Toán 2");
  });

  it("returns empty result for blank string", () => {
    const result = parseCurriculumPastedText("");
    expect(result.rows).toEqual([]);
    expect(result.stats.totalPeriods).toBe(0);
  });
});
