import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgSearchField, ErgSelect } from "@/components/erg-mui/erg-form";
import {
  AssignmentCheckbox,
} from "@/features/lms/components/assign-homework-parts";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

const pillSx = { borderRadius: 1, px: 1.5, py: 0.5, fontWeight: "fontWeightMedium", color: "primary.main" } as const;

export function ResourceSelectionStep({ model }: { model: AssignHomeworkController }) {
  const {
    attemptLimit,
    maxDurationMinutes,
    setSelectedLevelId,
    selectedResourceIds,
    resourceSearch,
    setResourceSearch,
    availableSubjects,
    selectedSubject,
    selectedLevel,
    filteredResourceTopics,
    filteredResourceCount,
    selectedResourceLabel,
    handleSubjectChange,
    toggleResourceSelection,
  } = model;
  return (
    <Box component="section" sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column", overflow: "hidden", borderRadius: 1, border: 1, borderColor: "divider", bgcolor: "background.paper", boxShadow: 1 }}>
      <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", px: 2.5, py: 1.5 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
          <Box>
            <Typography component="h2" variant="subtitle2" sx={{ fontWeight: "fontWeightMedium" }}>Chọn bài tập</Typography>
            <Typography variant="body2" sx={{ mt: 0.25, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
              {selectedSubject?.label ?? "Môn học"} · {selectedLevel?.label ?? "Level"} · {selectedResourceLabel}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Typography component="span" variant="body2" sx={{ ...pillSx, bgcolor: "info.light" }}>{attemptLimit} lần làm</Typography>
            <Typography component="span" variant="body2" sx={{ ...pillSx, border: 1, borderColor: "primary.main" }}>{maxDurationMinutes} phút tối đa</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "grid", minHeight: 0, flex: 1, gridTemplateColumns: "280px minmax(0, 1fr)", overflow: "hidden", bgcolor: "background.default" }}>
        <Box component="aside" sx={{ minHeight: 0, borderRight: 1, borderColor: "divider", bgcolor: "background.paper", p: 2 }}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <ErgSelect
              label="Môn học"
              size="small"
              value={selectedSubject?.id ?? ""}
              onChange={(event) => handleSubjectChange(event.target.value)}
              options={availableSubjects.map((item) => ({ label: item.label, value: item.id }))}
            />
            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "fontWeightBold" }}>Level</Typography>
              {selectedSubject?.levels.map((level) => {
                const active = level.id === selectedLevel?.id;
                return (
                  <ButtonBase
                    key={level.id}
                    onClick={() => {
                      setSelectedLevelId(level.id);
                      setResourceSearch("");
                    }}
                    sx={{
                      display: "block",
                      borderRadius: 1,
                      border: 1,
                      px: 1.5,
                      py: 1.25,
                      textAlign: "left",
                      transition: "background-color 150ms, border-color 150ms",
                      ...(active
                        ? { borderColor: "primary.main", bgcolor: "info.light", boxShadow: 1 }
                        : { borderColor: "divider", bgcolor: "background.paper", "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" } }),
                    }}
                  >
                    <Typography component="span" variant="body2" sx={{ display: "block", fontWeight: "fontWeightBold", color: active ? "primary.main" : "text.primary" }}>
                      {level.label}
                    </Typography>
                    <Typography component="span" variant="caption" sx={{ display: "block", mt: 0.25, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                      {level.description}
                    </Typography>
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", minHeight: 0, flexDirection: "column" }}>
          <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", px: 2, py: 1.5 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
              <ErgSearchField
                placeholder="Tìm bài trong level đang chọn..."
                value={resourceSearch}
                onChange={(event) => setResourceSearch(event.target.value)}
                sx={{ minWidth: 320, flex: 1 }}
              />
              <Typography component="span" variant="body2" sx={{ borderRadius: 1, border: 1, borderColor: "divider", bgcolor: "background.default", px: 1.5, py: 1, fontWeight: "fontWeightBold" }}>
                {filteredResourceCount} bài phù hợp
              </Typography>
            </Box>
          </Box>
          <Box sx={{ minHeight: 0, flex: 1, overflowY: "auto", p: 2 }}>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {filteredResourceTopics.map((topic) => (
                <Box component="section" key={topic.id} sx={{ overflow: "hidden", borderRadius: 1, border: 1, borderColor: "divider", bgcolor: "background.paper", boxShadow: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: "background.default", px: 2, py: 1.5 }}>
                    <Box>
                      <Typography component="h3" variant="subtitle2" sx={{ fontWeight: "fontWeightBold" }}>{topic.label}</Typography>
                      <Typography variant="caption" sx={{ display: "block", mt: 0.25, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                        {topic.items.length} bài trong chủ đề
                      </Typography>
                    </Box>
                    <Typography component="span" variant="caption" sx={{ borderRadius: 999, border: 1, borderColor: "divider", bgcolor: "background.paper", px: 1.25, py: 0.5, fontWeight: "fontWeightBold", color: "text.secondary" }}>
                      {selectedSubject?.label}
                    </Typography>
                  </Box>
                  <Box sx={{ "& > * + *": { borderTop: 1, borderColor: "divider" } }}>
                    {topic.items.map((item) => {
                      const checked = selectedResourceIds.has(item.id);
                      return (
                        <ButtonBase
                          key={item.id}
                          onClick={() => toggleResourceSelection(item.id)}
                          sx={{
                            display: "grid",
                            width: "100%",
                            gridTemplateColumns: "28px minmax(0, 1fr) auto",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            textAlign: "left",
                            transition: "background-color 150ms",
                            bgcolor: checked ? "info.light" : "background.paper",
                            "&:hover": checked ? undefined : { bgcolor: "action.hover" },
                          }}
                        >
                          <AssignmentCheckbox checked={checked} onChange={() => toggleResourceSelection(item.id)} label={`Chọn ${item.title}`} />
                          <Box component="span" sx={{ minWidth: 0 }}>
                            <Typography noWrap component="span" variant="body2" sx={{ display: "block", fontWeight: "fontWeightBold", color: checked ? "primary.main" : "text.primary" }}>
                              {item.title}
                            </Typography>
                            <Typography component="span" variant="caption" sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", gap: 0.75, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                              <span>{item.activityLabel}</span>
                              <span>·</span>
                              <span>{item.questionCount} câu</span>
                              <span>·</span>
                              <span>{item.durationLabel}</span>
                            </Typography>
                          </Box>
                          <ErgStatusChip
                            dot={false}
                            label={item.kind === "test" ? "Test" : "Train"}
                            tone={item.kind === "test" ? "warning" : "info"}
                          />
                        </ButtonBase>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
            {filteredResourceTopics.length === 0 ? (
              <Box sx={{ display: "flex", height: "100%", minHeight: 240, alignItems: "center", justifyContent: "center", borderRadius: 1, border: 1, borderStyle: "dashed", borderColor: "divider", bgcolor: "background.paper", textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                  Không tìm thấy bài phù hợp trong level đang chọn.
                </Typography>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
