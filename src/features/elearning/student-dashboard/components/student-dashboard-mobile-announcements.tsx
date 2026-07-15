import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";

import Card from "@mui/material/Card";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentTeacherAnnouncement } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

export function StudentDashboardMobileAnnouncements({
  announcements,
  copy,
  selectedAnnouncementId,
}: {
  announcements: StudentTeacherAnnouncement[];
  copy: DashboardCopy;
  selectedAnnouncementId: string | null;
}) {
  return (
    <Box component="section" sx={{"paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 4)"}}>
      <Box component="div" sx={{":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 4) * 0)","marginBlockEnd":"calc(calc(0.25rem * 4) * calc(1 - 0))"}}}>
        <Card sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 5)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"flex-start","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
            <div>
              <Box sx={{ bgcolor: "rgba(105,108,255,0.08)", borderRadius: 1, color: "#696CFF", display: "inline-flex", fontSize: 11, fontWeight: 500, px: 1.5, py: 0.5 }}>
                {copy.announcementTitle}
              </Box>
              <Box component="h1" sx={{"marginTop":"calc(0.25rem * 4)","fontSize":"29px","fontWeight":"600","lineHeight":"1.1","color":"oklch(20.8% 0.042 265.755)"}}>
                {copy.announcementHeroTitle}
              </Box>
              <Box component="p" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(44.6% 0.043 257.281)"}}>{copy.announcementDescription}</Box>
            </div>
            <Box component="div" sx={{"display":"grid","height":"calc(0.25rem * 11)","width":"calc(0.25rem * 11)","placeItems":"center","borderRadius":"0.5rem","backgroundColor":"#696CFF","color":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
              <CampaignOutlinedIcon sx={{ fontSize: 16 }} />
            </Box>
          </Box>
        </Card>

        <Box component="div" sx={{":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 3) * 0)","marginBlockEnd":"calc(calc(0.25rem * 3) * calc(1 - 0))"}}}>
          {announcements.map((announcement) => (
            <Box component="article"
              key={announcement.id}
              id={`student-announcement-${announcement.id}`}
              sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: selectedAnnouncementId === announcement.id ? "rgba(105,108,255,0.3)" : "divider", borderRadius: 1, boxShadow: selectedAnnouncementId === announcement.id ? "0 0 0 2px rgba(105,108,255,0.1)" : 1, p: 2, transition: "border-color 160ms ease, box-shadow 160ms ease" }}
            >
              <Box component="div" sx={{"display":"flex","alignItems":"flex-start","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
                <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
                  <Box component="div" sx={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 2)"}}>
                    {announcement.isPinned ? (
                      <Badge tone="primary">
                        <PushPinOutlinedIcon sx={{ fontSize: 16 }} />
                        {copy.announcementPinnedLabel}
                      </Badge>
                    ) : null}
                    <Badge tone="neutral">{announcement.targetLabel}</Badge>
                  </Box>
                  <Box component="h2" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"1.125rem","lineHeight":"calc(0.25rem * 6)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{announcement.title}</Box>
                  <Box component="p" sx={{"marginTop":"calc(0.25rem * 2)","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(44.6% 0.043 257.281)"}}>{announcement.content}</Box>
                </Box>
              </Box>

              <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","borderRadius":"0.5rem","backgroundColor":"#f8faff","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>
                <Box component="div" sx={{"fontWeight":"600","color":"oklch(27.9% 0.041 260.031)"}}>{announcement.teacherName}</Box>
                <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)"}}>{announcement.createdAtLabel}</Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "neutral" | "primary";
}) {
  return (
    <Box component="span" sx={{ alignItems: "center", bgcolor: tone === "primary" ? "rgba(105,108,255,0.08)" : "background.default", border: tone === "primary" ? 0 : "1px solid", borderColor: "divider", borderRadius: 999, color: tone === "primary" ? "#696CFF" : "text.secondary", display: "inline-flex", fontSize: 11, fontWeight: 500, gap: 0.5, px: 1.5, py: 0.5 }}>
      {children}
    </Box>
  );
}
