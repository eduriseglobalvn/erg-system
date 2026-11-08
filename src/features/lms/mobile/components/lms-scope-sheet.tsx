import { useState } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import GroupOffRoundedIcon from "@mui/icons-material/GroupOffRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import { MobileBottomSheet } from "./mobile-bottom-sheet";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgSheetOverline } from "@/components/portal/erg-mobile-sheet-parts";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { color, radius, size } = ergEnterpriseTokens;

export type LmsMobileSchoolOption = { id: string; name: string };
export type LmsMobileClassOption = { className: string; id: string; schoolId: string; studentCount?: number };

/** Design N3: school chips, class search and a radio list of the teacher's classes. */
export function LmsScopeSheet({
  classes, open, schools, selectedClassId, selectedSchoolId,
  onClassChange, onOpenChange, onSchoolChange,
}: {
  classes: LmsMobileClassOption[];
  open: boolean;
  schools: LmsMobileSchoolOption[];
  selectedClassId: string;
  selectedSchoolId: string;
  onClassChange: (classId: string) => void;
  onOpenChange: (open: boolean) => void;
  onSchoolChange: (schoolId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase("vi-VN");
  const schoolClasses = classes.filter((classroom) => classroom.schoolId === selectedSchoolId);
  const visibleClasses = query ? schoolClasses.filter((classroom) => classroom.className.toLocaleLowerCase("vi-VN").includes(query)) : schoolClasses;

  return (
    <MobileBottomSheet
      description="Trang Hôm nay, Học tập, Báo cáo sẽ theo lớp này"
      onOpenChange={onOpenChange}
      open={open}
      title="Chọn lớp đang dạy"
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
        {schools.length > 0 ? (
          <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <ErgSheetOverline>Trường</ErgSheetOverline>
            <Box role="group" aria-label="Trường" sx={{ display: "flex", gap: 1, mx: -2, overflowX: "auto", px: 2, scrollbarWidth: "none" }}>
              {schools.map((school) => {
                const active = school.id === selectedSchoolId;
                return (
                  <ButtonBase
                    aria-pressed={active}
                    key={school.id}
                    onClick={() => { setSearch(""); onSchoolChange(school.id); }}
                    sx={{ bgcolor: active ? color.primarySofter : "background.paper", border: 1, borderColor: active ? "primary.main" : "divider", borderRadius: `${radius.chip}px`, color: active ? "primary.dark" : "text.secondary", flexShrink: 0, gap: 0.75, minHeight: 36, px: 1.75, typography: "body2", fontWeight: active ? "fontWeightBold" : "fontWeightMedium", whiteSpace: "nowrap" }}
                  >
                    {active ? <CheckRoundedIcon sx={{ fontSize: size.iconSm }} /> : null}
                    {school.name}
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>
        ) : null}

        {schoolClasses.length > 0 ? (
          <ErgTextField
            compact
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm lớp…"
            slotProps={{
              htmlInput: { "aria-label": "Tìm lớp" },
              input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: "text.secondary", fontSize: size.iconMd }} /></InputAdornment> },
            }}
            type="search"
            value={search}
          />
        ) : null}

        <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <ErgSheetOverline>Lớp của tôi · {schoolClasses.length}</ErgSheetOverline>
          {schoolClasses.length === 0 ? (
            <Box sx={{ alignItems: "center", bgcolor: "background.paper", border: "1px dashed", borderColor: "divider", borderRadius: `${radius.card}px`, display: "flex", gap: 1.5, p: 2 }}>
              <Box sx={{ alignItems: "center", bgcolor: "action.hover", borderRadius: `${radius.control}px`, color: "text.secondary", display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}><GroupOffRoundedIcon /></Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">Bạn chưa được phân lớp ở trường này</Typography>
                <Typography color="text.secondary" component="div" variant="caption">Liên hệ quản lý trường để được thêm vào lớp.</Typography>
              </Box>
            </Box>
          ) : visibleClasses.length === 0 ? (
            <Typography color="text.secondary" variant="body2">Không có lớp khớp “{search.trim()}”.</Typography>
          ) : (
            <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${radius.card}px`, overflow: "hidden" }}>
              {visibleClasses.map((classroom, index) => {
                const active = classroom.id === selectedClassId;
                return (
                  <ButtonBase
                    aria-pressed={active}
                    key={classroom.id}
                    onClick={() => { onClassChange(classroom.id); onOpenChange(false); }}
                    sx={{ alignItems: "center", bgcolor: active ? color.primarySofter : "transparent", borderTop: index ? 1 : 0, borderColor: "divider", display: "flex", gap: 1.5, justifyContent: "flex-start", minHeight: 60, px: 2, py: 1.5, textAlign: "left", width: "100%" }}
                  >
                    <Box aria-hidden sx={{ bgcolor: "background.paper", border: active ? 7 : 2, borderColor: active ? "primary.main" : color.borderStrong, borderRadius: "50%", flexShrink: 0, height: 22, width: 22 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap variant="subtitle2">{classroom.className}</Typography>
                      {classroom.studentCount !== undefined ? <Typography color="text.secondary" component="div" variant="caption">{classroom.studentCount} học sinh</Typography> : null}
                    </Box>
                  </ButtonBase>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    </MobileBottomSheet>
  );
}
