import { useDeferredValue, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { ErgEmptyState, ErgLoadingSkeleton, ErgPageHeader, ErgSearchField } from "@/components/erg-mui";
import { HelpChapterSection } from "@/features/help/components/help-chapter-section";
import { HELP_FAQ_ID, HelpFaqSection } from "@/features/help/components/help-faq-section";
import { HelpTocList, HelpTocSelect } from "@/features/help/components/help-toc";
import { useHelpFaqsQuery, useHelpGuideQuery } from "@/features/help/help-queries";
import { filterChapters, filterFaqs } from "@/features/help/help-search";
import type { Workspace } from "@/platform/workspaces/workspace-domain";

export function HelpGuideView({ workspace }: { workspace: Workspace }) {
  const guide = useHelpGuideQuery(workspace);
  const faqs = useHelpFaqsQuery(workspace);
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search);

  const chapters = useMemo(() => filterChapters(guide.data?.chapters ?? [], query), [guide.data, query]);
  const shownFaqs = useMemo(() => filterFaqs(faqs.data ?? [], query), [faqs.data, query]);
  const searching = query.trim().length > 0;
  const toc = [...chapters.map(({ id, title }) => ({ id, title })), { id: HELP_FAQ_ID, title: "Câu hỏi thường gặp" }];

  if (guide.isPending) return <ErgLoadingSkeleton rows={6} />;
  if (!guide.data) {
    return <ErgEmptyState description="Hãy tải lại trang khi có mạng." title="Chưa mở được hướng dẫn" />;
  }

  return (
    <Box sx={{ mx: "auto", maxWidth: 1080, width: "100%" }}>
      <ErgPageHeader description={guide.data.intro} title={guide.data.title} />
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "220px minmax(0, 1fr)" } }}>
        <HelpTocList entries={toc} />
        <Box sx={{ display: "grid", gap: 2, minWidth: 0 }}>
          <ErgSearchField
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm nhanh, ví dụ: mật khẩu, cài đặt, điểm danh"
            slotProps={{ htmlInput: { "aria-label": "Tìm trong hướng dẫn" } }}
            value={search}
          />
          <HelpTocSelect entries={toc} />
          {searching && chapters.length === 0 && shownFaqs.length === 0 ? (
            <ErgEmptyState description="Thử từ khác ngắn hơn, ví dụ «mật khẩu»." title="Không tìm thấy" />
          ) : null}
          {chapters.map((chapter) => <HelpChapterSection chapter={chapter} key={chapter.id} />)}
          <HelpFaqSection failed={faqs.isError || faqs.fetchStatus === "paused"} faqs={shownFaqs} loading={faqs.isPending && faqs.fetchStatus === "fetching"} searching={searching} />
        </Box>
      </Box>
    </Box>
  );
}
