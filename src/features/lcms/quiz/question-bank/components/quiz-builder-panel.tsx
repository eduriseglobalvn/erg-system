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
import { alpha } from "@mui/material/styles";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import { cn } from "@/lib/utils";
import type { QuestionBankCopy } from "./question-bank-copy";
import { LabeledNumberField } from "./question-form-dialog";
import { QUESTION_BANK_SELECT_MENU_PROPS } from "./question-bank-primitives";

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
      variant="outlined"
      sx={{
        borderColor: alpha("#0f172a", 0.08),
        borderRadius: 3,
        boxShadow: "0 12px 32px rgba(15,23,42,0.045)",
        height: "fit-content",
        overflow: "visible",
        p: 2,
        position: { xl: "sticky" },
        top: { xl: 16 },
      }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography sx={{ color: "#111827", fontSize: 16, fontWeight: 850, lineHeight: 1.2 }}>
            {copy.builderTitle}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: 12.5, fontWeight: 550, mt: 0.5 }}>
            {copy.builderDescription}
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: alpha("#0f6cbd", 0.045),
            border: `1px solid ${alpha("#0f6cbd", 0.14)}`,
            borderRadius: 2.5,
            p: 2,
          }}
        >
          <Typography sx={{ color: "#111827", fontSize: 40, fontWeight: 900, lineHeight: 1 }}>
            {selectedQuestions.length}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: 11, fontWeight: 850, mt: 1, textTransform: "uppercase" }}>
            {copy.selectedQuestionCount}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={onCreateQuiz}
            disabled={!hasSelection}
            sx={{ borderRadius: 2, fontSize: 14, fontWeight: 850, mt: 2, py: 1.2 }}
          >
            {copy.createQuizAction(selectedQuestions.length)}
          </Button>
        </Box>

        <Box
          sx={{
            bgcolor: "#f8fafc",
            border: `1px solid ${alpha("#0f172a", 0.07)}`,
            borderRadius: 2.5,
            p: 1.5,
          }}
        >
          <Typography sx={{ color: "#475569", fontSize: 11, fontWeight: 850, mb: 1.5, textTransform: "uppercase" }}>
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
            variant="contained"
            onClick={onAutoPick}
            disabled={!canAutoPick}
            sx={{
              bgcolor: canAutoPick ? "#111827" : "#e2e8f0",
              borderRadius: 2,
              boxShadow: "none",
              color: canAutoPick ? "#fff" : "#94a3b8",
              fontWeight: 800,
              py: 1.1,
              "&:hover": {
                bgcolor: canAutoPick ? "#1f2937" : "#e2e8f0",
                boxShadow: "none",
              },
            }}
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
    <div className="space-y-3">
      <FormControl fullWidth size="small" className="bg-white">
        <InputLabel id="auto-topic-select-label">{copy.autoTopicLabel}</InputLabel>
        <Select
          labelId="auto-topic-select-label"
          multiple
          value={selectedTopicIds}
          MenuProps={QUESTION_BANK_SELECT_MENU_PROPS}
          onChange={(event) => handleTopicChange(event.target.value)}
          input={<OutlinedInput label={copy.autoTopicLabel} />}
          renderValue={() => (
            <span className={cn("font-bold", selectedTopics.length ? "text-slate-900" : "text-slate-400")}>
              {summaryLabel}
            </span>
          )}
          sx={{
            borderRadius: "12px",
            backgroundColor: "#fff",
            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d7e0ec" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#93c5fd" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1976d2", borderWidth: 2 },
            "& .MuiSelect-select": {
              minHeight: "28px",
              display: "flex",
              alignItems: "center",
              paddingTop: "10px",
              paddingBottom: "10px",
              fontSize: "14px",
            },
          }}
        >
          {levelTopics.map((topic) => {
            const checked = selectedTopicIdSet.has(topic.id);
            const questionCount = getTopicQuestionCount(topic.id);

            return (
              <MenuItem key={topic.id} value={topic.id} className="gap-2 rounded-lg py-1.5">
                <Checkbox checked={checked} size="small" />
                <ListItemText
                  primary={
                    <span className={cn("block truncate", checked ? "font-bold text-blue-800" : "font-semibold text-slate-700")}>
                      {topic.label}
                    </span>
                  }
                />
                <span
                  className={cn(
                    "ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                    checked ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {copy.questionCount(questionCount)}
                </span>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

    </div>
  );
}
