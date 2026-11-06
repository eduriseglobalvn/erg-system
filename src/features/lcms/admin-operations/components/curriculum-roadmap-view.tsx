import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Add from "@mui/icons-material/Add";

import { RoadmapStage } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-stage";
import { EmptyRoadmapState } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-summary";
import { RoadmapSummaryBar } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-summary-bar";
import { countRoadmapTotals, filterRoadmapStages, normalizeRoadmapQuery } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-filter";
import type { CurriculumRoadmapViewProps } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-types";
import { useRoadmapExpansion } from "@/features/lcms/admin-operations/components/curriculum-roadmap/use-roadmap-expansion";

export type { CurriculumRoadmapActions, CurriculumRoadmapViewProps } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-types";

export function CurriculumRoadmapView({
  stages,
  subjectTitle,
  query,
  selectedTarget,
  onOpenFolder,
  onOpenContent,
  actions,
}: CurriculumRoadmapViewProps) {
  const { expandedLevelIds, toggleLevel, handleExpandAll, handleCollapseAll } = useRoadmapExpansion(
    stages,
    subjectTitle,
    selectedTarget,
  );

  const normalizedQuery = normalizeRoadmapQuery(query);
  const visibleStages = filterRoadmapStages(stages, normalizedQuery);
  const { topics: totalTopics, lessons: totalLessons } = countRoadmapTotals(visibleStages);

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0, flexDirection: "column", bgcolor: "#FAFAFC" }}>
      <RoadmapSummaryBar
        subjectTitle={subjectTitle}
        levelCount={visibleStages.length}
        totalTopics={totalTopics}
        totalLessons={totalLessons}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
      />

      {/* Main roadmap timeline canvas */}
      <Box
        sx={{
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          px: { xs: 2, lg: 3.5 },
          py: 3,
          scrollbarGutter: "stable",
        }}
      >
        {visibleStages.length ? (
          <Box sx={{ mx: "auto", maxWidth: 1140 }}>
            {visibleStages.map((stage, index) => (
              <RoadmapStage
                key={stage.level.id}
                stage={stage}
                index={index}
                isLast={index === visibleStages.length - 1}
                expanded={Boolean(normalizedQuery) || expandedLevelIds.has(stage.level.id)}
                selectedTarget={selectedTarget}
                onToggle={() => toggleLevel(stage.level.id)}
                onOpenFolder={onOpenFolder}
                onOpenContent={onOpenContent}
                actions={actions}
              />
            ))}

            {/* Bottom inline add next Level */}
            <Box
              sx={{
                mt: 2.5,
                mb: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #CBD5E1",
                borderRadius: 2.5,
                bgcolor: "#FFFFFF",
                p: 2.5,
                transition: "all 150ms ease",
                "&:hover": { borderColor: "#0071E3", bgcolor: "#F0F7FF" },
              }}
            >
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={actions.onCreateLevel}
                sx={{
                  borderColor: "#93C5FD",
                  bgcolor: "#FFFFFF",
                  color: "#0071E3",
                  fontWeight: 600,
                  fontSize: 13,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 2.5,
                  py: 0.75,
                  boxShadow: "0 1px 3px rgba(0, 113, 227, 0.08)",
                  "&:hover": { bgcolor: "#EFF6FF", borderColor: "#0071E3" },
                }}
              >
                Thêm chặng học (Level) tiếp theo cho {subjectTitle}
              </Button>
            </Box>
          </Box>
        ) : (
          <EmptyRoadmapState
            subjectTitle={subjectTitle}
            query={normalizedQuery}
            onCreateLevel={actions.onCreateLevel}
          />
        )}
      </Box>
    </Box>
  );
}
