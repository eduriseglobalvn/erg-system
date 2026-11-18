import Box from "@mui/material/Box";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import { ErgSelect } from "@/components/erg-mui";
import { helpChapterAnchor } from "@/features/help/components/help-chapter-section";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export type HelpTocEntry = { id: string; title: string };

function scrollToChapter(id: string) {
  document.getElementById(helpChapterAnchor(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Left sticky list from md up. */
export function HelpTocList({ entries }: { entries: HelpTocEntry[] }) {
  return (
    <Box component="nav" aria-label="Mục lục" sx={{ alignSelf: "start", display: { xs: "none", md: "block" }, position: "sticky", top: 16 }}>
      <Typography color="text.secondary" sx={{ mb: 1, px: 1.5 }} variant="overline">Mục lục</Typography>
      {entries.map((entry) => (
        <ListItemButton
          key={entry.id}
          onClick={() => scrollToChapter(entry.id)}
          sx={{ borderRadius: `${ergEnterpriseTokens.radius.control}px`, py: 0.75 }}
        >
          <Typography variant="body2">{entry.title}</Typography>
        </ListItemButton>
      ))}
    </Box>
  );
}

/** Chapter picker on top for phones. */
export function HelpTocSelect({ entries }: { entries: HelpTocEntry[] }) {
  return (
    <Box sx={{ display: { xs: "block", md: "none" } }}>
      <ErgSelect
        label="Đi tới chương"
        onChange={(event) => scrollToChapter(String(event.target.value))}
        options={entries.map((entry) => ({ label: entry.title, value: entry.id }))}
        size="small"
        value=""
      />
    </Box>
  );
}
