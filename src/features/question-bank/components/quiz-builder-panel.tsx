import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { cn } from "@/lib/utils";
import type { QuestionBankCopy } from "./question-bank-copy";
import { LabeledNumberField } from "./question-form-dialog";
import { QUESTION_BANK_SELECT_MENU_PROPS } from "./question-bank-primitives";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

export function QuizBuilderPanel({
  autoCount,
  autoPickedQuestions,
  autoTopicIds,
  copy,
  getTopicQuestionCount,
  levelTopics,
  onAutoCountChange,
  onAutoPick,
  onCreateQuiz,
  onTopicToggle,
  selectedQuestions,
}: {
  autoCount: number;
  autoPickedQuestions: QuestionBankQuestion[];
  autoTopicIds: string[];
  copy: QuestionBankCopy;
  getTopicQuestionCount: (topicId: string) => number;
  levelTopics: Array<{ id: string; label: string }>;
  onAutoCountChange: (value: number) => void;
  onAutoPick: () => void;
  onCreateQuiz: () => void;
  onTopicToggle: (topicId: string) => void;
  selectedQuestions: QuestionBankQuestion[];
}) {
  const hasSelection = selectedQuestions.length > 0;
  const canAutoPick = autoTopicIds.length > 0 && autoPickedQuestions.length >= autoCount;

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        border: `1px solid ${ergEnterpriseTokens.color.border}`,
        borderRadius: "16px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03), 0 10px 24px -4px rgba(0, 0, 0, 0.05)",
        height: "fit-content",
        overflow: "visible",
        p: 2.25,
        position: { xl: "sticky" },
        top: { xl: 16 },
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
            {copy.builderTitle}
          </Typography>
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8125rem", fontWeight: 500, mt: 0.25, lineHeight: 1.4 }}>
            {copy.builderDescription}
          </Typography>
        </Box>

        {/* Selected Counter Card */}
        <Box
          sx={{
            bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.04),
            border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.16)}`,
            borderRadius: "14px",
            p: 2,
          }}
        >
          <Typography sx={{ color: ergEnterpriseTokens.color.primary, fontSize: 38, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {selectedQuestions.length}
          </Typography>
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", mt: 0.75, textTransform: "uppercase" }}>
            {copy.selectedQuestionCount}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={onCreateQuiz}
            disabled={!hasSelection}
            sx={{
              bgcolor: hasSelection ? `${ergEnterpriseTokens.color.primary} !important` : "rgba(0, 0, 0, 0.08) !important",
              borderRadius: "10px",
              minHeight: 44,
              boxShadow: hasSelection ? `0 2px 8px ${alpha(ergEnterpriseTokens.color.primary, 0.28)}` : "none",
              color: hasSelection ? "#FFFFFF !important" : "rgba(0, 0, 0, 0.35) !important",
              fontSize: "0.875rem",
              fontWeight: 600,
              mt: 2,
              py: 1.1,
              textTransform: "none",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: hasSelection ? `${ergEnterpriseTokens.color.primaryHover} !important` : "rgba(0, 0, 0, 0.08) !important",
                boxShadow: hasSelection ? `0 4px 14px ${alpha(ergEnterpriseTokens.color.primary, 0.38)}` : "none",
                transform: hasSelection ? "translateY(-1px)" : "none",
              },
              "&:active": {
                transform: hasSelection ? "scale(0.985)" : "none",
              },
            }}
          >
            {copy.createQuizAction(selectedQuestions.length)}
          </Button>
        </Box>

        {/* Auto Builder Section */}
        <Box
          sx={{
            bgcolor: "#FBFBFD",
            border: `1px solid ${ergEnterpriseTokens.color.border}`,
            borderRadius: "14px",
            p: 1.75,
          }}
        >
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", mb: 1.5, textTransform: "uppercase" }}>
            {copy.autoBuilderTitle}
          </Typography>
          <Stack spacing={1.5}>
            <LabeledNumberField
              label={copy.autoCountLabel}
              value={autoCount}
              onChange={onAutoCountChange}
            />

            <AutoTopicDropdown
              copy={copy}
              getTopicQuestionCount={getTopicQuestionCount}
              levelTopics={levelTopics}
              selectedTopicIds={autoTopicIds}
              onTopicToggle={onTopicToggle}
            />

            <Button
              fullWidth
              variant="outlined"
              onClick={onAutoPick}
              disabled={!canAutoPick}
              sx={{ minHeight: 44, py: 1 }}
            >
              {copy.autoPickAction}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function AutoTopicDropdown({
  copy,
  getTopicQuestionCount,
  levelTopics,
  onTopicToggle,
  selectedTopicIds,
}: {
  copy: QuestionBankCopy;
  getTopicQuestionCount: (topicId: string) => number;
  levelTopics: Array<{ id: string; label: string }>;
  onTopicToggle: (topicId: string) => void;
  selectedTopicIds: string[];
}) {
  const selectedTopics = levelTopics.filter((topic) => selectedTopicIds.includes(topic.id));
  const selectedTopicIdSet = new Set(selectedTopicIds);
  const summaryLabel = selectedTopics.length
    ? copy.autoTopicSelectedSummary(selectedTopics.length)
    : copy.autoTopicDropdownPlaceholder;

  function handleTopicChange(value: unknown) {
    const nextTopicIds = Array.isArray(value) ? value.map(String) : String(value).split(",").filter(Boolean);
    const nextTopicIdSet = new Set(nextTopicIds);

    levelTopics.forEach((topic) => {
      const currentlySelected = selectedTopicIdSet.has(topic.id);
      const shouldBeSelected = nextTopicIdSet.has(topic.id);
      if (currentlySelected !== shouldBeSelected) {
        onTopicToggle(topic.id);
      }
    });
  }

  return (
    <FormControl fullWidth size="small">
      <InputLabel id="auto-topic-select-label" sx={{ fontSize: "0.825rem", fontWeight: 600, color: ergEnterpriseTokens.color.textMuted }}>
        {copy.autoTopicLabel}
      </InputLabel>
      <Select
        labelId="auto-topic-select-label"
        multiple
        value={selectedTopicIds}
        MenuProps={QUESTION_BANK_SELECT_MENU_PROPS}
        onChange={(event) => handleTopicChange(event.target.value)}
        input={<OutlinedInput label={copy.autoTopicLabel} />}
        renderValue={() => (
          <span className={cn("text-xs font-bold", selectedTopics.length ? "text-slate-900" : "text-slate-400")}>
            {summaryLabel}
          </span>
        )}
        sx={{
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          fontSize: "0.85rem",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0, 0, 0, 0.12)" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0, 0, 0, 0.24)" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: ergEnterpriseTokens.color.primary,
            boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
          },
          "& .MuiSelect-select": {
            alignItems: "center",
            display: "flex",
            minHeight: "24px",
            paddingBottom: "8px",
            paddingTop: "8px",
          },
        }}
      >
        {levelTopics.map((topic) => {
          const checked = selectedTopicIdSet.has(topic.id);
          const questionCount = getTopicQuestionCount(topic.id);

          return (
            <MenuItem key={topic.id} value={topic.id} sx={{ borderRadius: "8px", gap: 1, mx: 0.5, my: 0.25, py: 1 }}>
              <Checkbox
                checked={checked}
                size="small"
                sx={{
                  color: "rgba(0, 0, 0, 0.25)",
                  p: 0.25,
                  "&.Mui-checked": { color: ergEnterpriseTokens.color.primary },
                }}
              />
              <ListItemText
                primary={
                  <Typography
                    sx={{
                      color: checked ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.text,
                      fontSize: "0.85rem",
                      fontWeight: checked ? 700 : 550,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {topic.label}
                  </Typography>
                }
              />
              <Box
                component="span"
                sx={{
                  bgcolor: checked ? alpha(ergEnterpriseTokens.color.primary, 0.08) : "rgba(0, 0, 0, 0.05)",
                  borderRadius: "9999px",
                  color: checked ? ergEnterpriseTokens.color.primary : ergEnterpriseTokens.color.textMuted,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  ml: 1,
                  px: 1,
                  py: 0.2,
                }}
              >
                {copy.questionCount(questionCount)}
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}
