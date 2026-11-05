import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import CasinoIcon from "@mui/icons-material/Casino";
import CloseIcon from "@mui/icons-material/Close";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgSearchField, ErgTextField } from "@/components/erg-mui/erg-form";
import { FilterDropdown } from "./filter-dropdown";
import type { BankQuestion, BankSubject } from "./types";

export function PickFilterBar({
  subjects,
  selectedSubjectId,
  currentSubject,
  handleSubjectChange,
  questionSearch,
  setQuestionSearch,
  selectedLevel,
  handleLevelChange,
  subjectLevels,
  selectedTopic,
  setSelectedTopic,
  availableTopics,
  selectedDifficulty,
  setSelectedDifficulty,
  hasActiveFilters,
  resetFilters,
  customPickCount,
  setCustomPickCount,
  handleCustomPick,
  displayedQuestions,
  totalSubjectQuestions,
  selectAllCurrentView,
  deselectAllCurrentView,
}: {
  subjects: BankSubject[];
  selectedSubjectId: string;
  currentSubject: BankSubject | undefined;
  handleSubjectChange: (id: string) => void;
  questionSearch: string;
  setQuestionSearch: (value: string) => void;
  selectedLevel: string;
  handleLevelChange: (id: string) => void;
  subjectLevels: BankSubject["levels"];
  selectedTopic: string;
  setSelectedTopic: (id: string) => void;
  availableTopics: BankSubject["categories"];
  selectedDifficulty: string;
  setSelectedDifficulty: (value: string) => void;
  hasActiveFilters: boolean;
  resetFilters: () => void;
  customPickCount: string;
  setCustomPickCount: (value: string) => void;
  handleCustomPick: () => void;
  displayedQuestions: BankQuestion[];
  totalSubjectQuestions: number;
  selectAllCurrentView: () => void;
  deselectAllCurrentView: () => void;
}) {
  return (
    <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", bgcolor: "background.default", px: { xs: 1.5, sm: 3 }, py: 1.5, display: "grid", gap: 1.25 }}>
      {/* Hàng 1: Môn học + Ô tìm kiếm + Cấp độ + Chủ đề + Độ khó */}
      <Box sx={{ display: "flex", flexWrap: { xs: "wrap", lg: "nowrap" }, alignItems: "center", gap: 1 }}>
        {/* Cụm Môn học + Tìm kiếm */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", lg: "auto" }, flex: { lg: 1 } }}>
          <FilterDropdown
            value={selectedSubjectId || currentSubject?.id || ""}
            onChange={(e) => handleSubjectChange(e.target.value)}
            icon={<MenuBookIcon fontSize="inherit" />}
            sx={{ minWidth: 125, flexShrink: 0 }}
          >
            {subjects.map((sub) => (
              <MenuItem key={sub.id} value={sub.id}>
                {sub.label}
              </MenuItem>
            ))}
          </FilterDropdown>

          <ErgSearchField
            value={questionSearch}
            onChange={(e) => setQuestionSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="Tìm kiếm nội dung câu hỏi, từ khóa..."
            slotProps={{
              input: {
                endAdornment: questionSearch ? (
                  <ErgIconButton label="Xóa tìm kiếm" size="small" onClick={() => setQuestionSearch("")}>
                    <CloseIcon fontSize="inherit" />
                  </ErgIconButton>
                ) : undefined,
              },
            }}
            sx={{ flex: 1, minWidth: 170 }}
          />
        </Box>

        {/* Cụm Cấp độ + Chủ đề + Độ khó */}
        <Box sx={{ display: "flex", flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center", gap: 0.75, width: { xs: "100%", lg: "auto" }, flexShrink: 0 }}>
          <FilterDropdown
            value={selectedLevel}
            onChange={(e) => handleLevelChange(e.target.value)}
            isFiltered={selectedLevel !== "all"}
            sx={{ flex: { xs: 1, sm: "initial" }, minWidth: 130 }}
          >
            <MenuItem value="all">Tất cả cấp độ ({subjectLevels.length})</MenuItem>
            {subjectLevels.map((lvl) => (
              <MenuItem key={lvl.id} value={lvl.id}>
                {lvl.label}
              </MenuItem>
            ))}
          </FilterDropdown>

          <FilterDropdown
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            isFiltered={selectedTopic !== "all"}
            sx={{ flex: { xs: 1, sm: "initial" }, minWidth: 135, maxWidth: 210 }}
          >
            <MenuItem value="all">Tất cả chủ đề ({availableTopics.length})</MenuItem>
            {availableTopics.map((tpc) => (
              <MenuItem key={tpc.id} value={tpc.id}>
                {tpc.label}
              </MenuItem>
            ))}
          </FilterDropdown>

          <FilterDropdown
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            isFiltered={selectedDifficulty !== "all"}
            sx={{ flex: { xs: 1, sm: "initial" }, minWidth: 115 }}
          >
            <MenuItem value="all">Tất cả độ khó</MenuItem>
            <MenuItem value="core">Cơ bản</MenuItem>
            <MenuItem value="stretch">Nâng cao</MenuItem>
            <MenuItem value="challenge">Thử thách</MenuItem>
          </FilterDropdown>

          {hasActiveFilters && (
            <ErgButton
              variant="text"
              color="error"
              size="small"
              onClick={resetFilters}
              startIcon={<RestartAltIcon fontSize="small" />}
              title="Đặt lại bộ lọc"
              sx={{ flexShrink: 0 }}
            >
              Đặt lại
            </ErgButton>
          )}
        </Box>
      </Box>

      {/* Hàng 2: Thao tác bốc nhanh & Thống kê */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography
            variant="caption"
            sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0, color: "text.secondary", fontWeight: "fontWeightBold", textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            <CasinoIcon color="primary" fontSize="inherit" />
            Bốc ngẫu nhiên:
          </Typography>
          <ErgTextField
            compact
            fullWidth={false}
            type="number"
            value={customPickCount}
            onChange={(e) => setCustomPickCount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomPick();
              }
            }}
            placeholder="Nhập số câu..."
            slotProps={{ htmlInput: { min: 1, max: displayedQuestions.length } }}
            sx={{ width: 120 }}
          />
          <ErgButton
            variant="outlined"
            size="small"
            onClick={handleCustomPick}
            disabled={!customPickCount || parseInt(customPickCount, 10) <= 0}
            startIcon={<CasinoIcon fontSize="small" />}
            title="Bốc đúng số lượng random câu"
          >
            Bốc câu hỏi
          </ErgButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.25 } }}>
          <ErgButton variant="text" size="small" onClick={selectAllCurrentView}>
            Chọn tất cả ({displayedQuestions.length})
          </ErgButton>
          <Typography component="span" variant="caption" color="text.disabled">•</Typography>
          <ErgButton variant="text" size="small" color="inherit" onClick={deselectAllCurrentView}>
            Bỏ chọn
          </ErgButton>
          <Typography component="span" variant="caption" color="text.disabled">|</Typography>
          <Typography component="span" variant="caption" color="text.secondary">
            Hiển thị <Box component="strong" sx={{ color: "text.primary", fontWeight: "fontWeightBold" }}>{displayedQuestions.length}</Box> / {totalSubjectQuestions} câu
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
