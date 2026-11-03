export interface ParsedCurriculumItem {
  topic: string;
  period: number;
  title: string;
  sessions: number;
  isReview?: boolean;
  isPractice?: boolean;
}

export interface ParseCurriculumResult {
  rows: ParsedCurriculumItem[];
  stats: {
    totalLessons: number;
    totalPeriods: number;
    totalTopics: number;
    reviewCount: number;
    practiceCount: number;
  };
  errors: string[];
}

function cleanText(text: string | undefined): string {
  if (!text) return "";
  return text.trim().replace(/^["']|["']$/g, "");
}

function isHeader(rowCells: string[]): boolean {
  if (!rowCells.length) return false;
  const joined = rowCells.join(" ").toLowerCase();
  return (
    joined.includes("chủ đề") ||
    joined.includes("chu de") ||
    joined.includes("tên bài học") ||
    joined.includes("ten bai hoc") ||
    (joined.includes("tiết") && joined.includes("bài")) ||
    joined.includes("topic") ||
    joined.includes("lesson")
  );
}

function detectIsReview(title: string): boolean {
  const normalized = title.toLowerCase();
  return (
    normalized.includes("ôn tập") ||
    normalized.includes("on tap") ||
    normalized.startsWith("review")
  );
}

function detectIsPractice(title: string): boolean {
  const normalized = title.toLowerCase();
  return (
    normalized.includes("luyện thi") ||
    normalized.includes("luyen thi") ||
    normalized.includes("thi thử") ||
    normalized.includes("mock test") ||
    normalized.includes("practice exam")
  );
}

/**
 * Parses raw text pasted from Excel or Google Sheets.
 * Handles:
 * - 3-column format: [Chủ đề] [Tiết] [Tên bài học]
 * - 2-column format: [Chủ đề] [Tên bài học]
 * - 4-column format: [Chủ đề] [Tiết] [Tên bài học] [Số tiết]
 * - Merged topic cells (empty cells inherit previous topic)
 * - Auto-detects header row
 * - Identifies "Ôn tập" and "Luyện thi" special period rows
 */
export function parseCurriculumPastedText(rawText: string): ParseCurriculumResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      rows: [],
      stats: {
        totalLessons: 0,
        totalPeriods: 0,
        totalTopics: 0,
        reviewCount: 0,
        practiceCount: 0,
      },
      errors: [],
    };
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) {
    return {
      rows: [],
      stats: {
        totalLessons: 0,
        totalPeriods: 0,
        totalTopics: 0,
        reviewCount: 0,
        practiceCount: 0,
      },
      errors: [],
    };
  }

  // Detect delimiter: tab or comma or semicolon
  const firstLine = lines[0];
  let delimiter = "\t";
  if (!firstLine.includes("\t")) {
    if (firstLine.includes(";")) delimiter = ";";
    else if (firstLine.includes(",")) delimiter = ",";
  }

  const parsedLines = lines.map((line) => line.split(delimiter).map(cleanText));
  let startIndex = 0;
  if (isHeader(parsedLines[0])) {
    startIndex = 1;
  }

  const rows: ParsedCurriculumItem[] = [];
  let currentTopic = "Chủ đề 1";
  const uniqueTopics = new Set<string>();
  let reviewCount = 0;
  let practiceCount = 0;

  for (let i = startIndex; i < parsedLines.length; i++) {
    const cells = parsedLines[i];
    if (cells.every((c) => c === "")) continue;

    let topicCell = "";
    let periodNumber = rows.length + 1;
    let titleCell = "";
    let sessions = 1;

    if (cells.length >= 3) {
      // Format 3+ cols: [Topic, Period, Title, (optional Sessions)]
      topicCell = cells[0];
      const parsedPeriod = parseInt(cells[1], 10);
      if (!Number.isNaN(parsedPeriod) && parsedPeriod > 0) {
        periodNumber = parsedPeriod;
      }
      titleCell = cells[2];
      if (cells.length >= 4) {
        const parsedSessions = parseInt(cells[3], 10);
        if (!Number.isNaN(parsedSessions) && parsedSessions > 0) {
          sessions = parsedSessions;
        }
      }
    } else if (cells.length === 2) {
      // 2 cols: Could be [Topic, Title] OR [Period, Title]
      const col0AsNumber = parseInt(cells[0], 10);
      if (!Number.isNaN(col0AsNumber) && col0AsNumber > 0 && /^\d+$/.test(cells[0])) {
        // [Period, Title] -> inherit topic
        periodNumber = col0AsNumber;
        titleCell = cells[1];
      } else {
        // [Topic, Title]
        topicCell = cells[0];
        titleCell = cells[1];
        periodNumber = rows.length + 1;
      }
    } else if (cells.length === 1) {
      // Single cell -> Treat as lesson title inheriting previous topic
      titleCell = cells[0];
    }

    if (topicCell && topicCell.trim().length > 0) {
      currentTopic = topicCell.trim();
    }

    if (!titleCell && topicCell) {
      // In case user had a line with only topic
      continue;
    }

    uniqueTopics.add(currentTopic);

    const isReview = detectIsReview(titleCell);
    const isPractice = detectIsPractice(titleCell);

    if (isReview) reviewCount++;
    if (isPractice) practiceCount++;

    rows.push({
      topic: currentTopic,
      period: periodNumber,
      title: titleCell || `Tiết ${periodNumber}`,
      sessions,
      isReview,
      isPractice,
    });
  }

  const totalPeriods = rows.reduce((acc, r) => acc + (r.sessions || 1), 0);

  return {
    rows,
    stats: {
      totalLessons: rows.length,
      totalPeriods,
      totalTopics: uniqueTopics.size,
      reviewCount,
      practiceCount,
    },
    errors: [],
  };
}
