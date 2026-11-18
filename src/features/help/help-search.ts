import type { HelpFaq } from "@/features/help/help-queries";
import type { HelpChapter } from "@/features/help/help-types";

/** Lower-case, drop Vietnamese tone marks and đ, so "dang nhap" finds «Đăng nhập». */
export function foldText(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

function matches(query: string, ...texts: (string | undefined)[]) {
  return texts.some((text) => text !== undefined && foldText(text).includes(query));
}

/** A chapter whose title matches keeps every step; otherwise only its matching steps are kept. */
export function filterChapters(chapters: HelpChapter[], rawQuery: string): HelpChapter[] {
  const query = foldText(rawQuery.trim());
  if (!query) return chapters;
  return chapters.flatMap((chapter) => {
    if (matches(query, chapter.title, chapter.intro)) return [chapter];
    const steps = chapter.steps.filter((step) => matches(query, step.text, step.note, step.warning));
    return steps.length ? [{ ...chapter, steps }] : [];
  });
}

export function filterFaqs(faqs: HelpFaq[], rawQuery: string) {
  const query = foldText(rawQuery.trim());
  if (!query) return faqs;
  return faqs.filter((faq) => matches(query, faq.category, faq.question, faq.answer));
}
