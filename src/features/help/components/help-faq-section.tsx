import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { ErgLoadingSkeleton } from "@/components/erg-mui";
import { helpChapterAnchor, helpSectionSx } from "@/features/help/components/help-chapter-section";
import type { HelpFaq } from "@/features/help/help-queries";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export const HELP_FAQ_ID = "faq";

type HelpFaqSectionProps = {
  faqs: HelpFaq[];
  failed: boolean;
  loading: boolean;
  searching: boolean;
};

export function HelpFaqSection({ faqs, failed, loading, searching }: HelpFaqSectionProps) {
  return (
    <Box component="section" id={helpChapterAnchor(HELP_FAQ_ID)} sx={helpSectionSx}>
      <Typography component="h2" sx={{ mb: 2 }} variant="h6">Câu hỏi thường gặp</Typography>
      {loading ? <ErgLoadingSkeleton rows={3} /> : null}
      {failed ? (
        <Alert severity="info">
          Chưa tải được câu hỏi thường gặp, có thể do mạng yếu hoặc đang mất mạng. Bạn vẫn đọc được hướng dẫn ở trên. Khi có mạng, hãy mở lại trang này.
        </Alert>
      ) : null}
      {!loading && !failed && faqs.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          {searching ? "Không có câu hỏi nào khớp với từ đang tìm." : "Chưa có câu hỏi thường gặp."}
        </Typography>
      ) : null}
      {faqs.map((faq) => (
        <Accordion
          disableGutters
          elevation={0}
          key={faq.id}
          sx={{ "&::before": { display: "none" }, borderTop: `1px solid ${ergEnterpriseTokens.color.divider}` }}
        >
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Box sx={{ minWidth: 0 }}>
              <Typography color="text.secondary" variant="caption">{faq.category}</Typography>
              <Typography variant="subtitle2">{faq.question}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ whiteSpace: "pre-line" }} variant="body2">{faq.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
