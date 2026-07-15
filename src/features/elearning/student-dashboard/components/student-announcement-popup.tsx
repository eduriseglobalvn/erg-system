import Box from "@mui/material/Box";
import type { MouseEvent } from "react";

import type { StudentTeacherAnnouncement } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

type StudentAnnouncementPopupProps = {
  announcement: StudentTeacherAnnouncement;
  autoDismissLabel: string;
  ctaLabel: string;
  dismissLabel: string;
  isOpen: boolean;
  pinnedLabel: string;
  snoozeLabel: string;
  onClose: () => void;
  onOpenDetail: (announcementId: string) => void;
  onSnooze: (announcementId: string) => void;
};

export function StudentAnnouncementPopup({
  announcement,
  autoDismissLabel,
  ctaLabel,
  dismissLabel,
  isOpen,
  pinnedLabel,
  snoozeLabel,
  onClose,
  onOpenDetail,
  onSnooze,
}: StudentAnnouncementPopupProps) {
  if (!isOpen) {
    return null;
  }

  function handleCardClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    onOpenDetail(announcement.id);
  }

  function handleCloseClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onClose();
  }

  function handleSnoozeClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onSnooze(announcement.id);
  }

  return (
    <Box component="div"
      aria-hidden={!isOpen}
      sx={{"position":"fixed","inset":"calc(0.25rem * 0)","zIndex":"50","backgroundColor":"color-mix(in srgb, oklch(12.9% 0.042 264.695) 38%, transparent)","@supports (color: color-mix(in lab, red, red))":{"backgroundColor":"color-mix(in oklab, oklch(12.9% 0.042 264.695) 38%, transparent)"},"WebkitBackdropFilter":"blur(3px)        ","backdropFilter":"blur(3px)        "}}
      onClick={onClose}
    >
      <Box component="div" sx={{"pointerEvents":"none","display":"flex","minHeight":"100%","alignItems":"center","justifyContent":"center","padding":"calc(0.25rem * 4)","@media (min-width: 40rem)":{"padding":"calc(0.25rem * 6)"}}}>
        <Box component="div"
          sx={{"pointerEvents":"auto","width":"100%","maxWidth":"760px","cursor":"pointer","overflow":"hidden","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in oklab, #696CFF 10%, transparent)","backgroundColor":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms"}}
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenDetail(announcement.id);
            }
          }}
        >
          <Box component="div" sx={{"height":"calc(0.25rem * 2)","width":"100%","backgroundColor":"#FF5630"}} />
          <Box component="div" sx={{":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 5) * 0)","marginBlockEnd":"calc(calc(0.25rem * 5) * calc(1 - 0))"},"padding":"calc(0.25rem * 5)","@media (min-width: 40rem)":{"padding":"calc(0.25rem * 7)"}}}>
            <Box component="div" sx={{"display":"flex","alignItems":"flex-start","justifyContent":"space-between","gap":"calc(0.25rem * 4)"}}>
              <Box component="div" sx={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 3)"}}>
                {announcement.isPinned ? (
                  <Box component="span" sx={{"borderRadius":"9999px","backgroundColor":"color-mix(in oklab, #FF5630 10%, transparent)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 1.5)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"500","color":"#FF5630"}}>
                    {pinnedLabel}
                  </Box>
                ) : null}
                <Box component="span" sx={{"borderRadius":"9999px","backgroundColor":"oklch(96.8% 0.007 247.896)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 1.5)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(55.4% 0.046 257.417)"}}>
                  {announcement.targetLabel}
                </Box>
              </Box>
              <Box component="button"
                type="button"
                aria-label={dismissLabel}
                sx={{"display":"grid","height":"calc(0.25rem * 10)","width":"calc(0.25rem * 10)","flexShrink":"0","placeItems":"center","borderRadius":"9999px","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","color":"oklch(70.4% 0.04 256.788)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media (hover: hover)":{"borderColor":"oklch(86.9% 0.022 252.894)","backgroundColor":"oklch(98.4% 0.003 247.858)","color":"oklch(37.2% 0.044 257.287)"}}}}
                onClick={handleCloseClick}
              >
                <Box component="span" sx={{"fontSize":"1.25rem","lineHeight":"1"}}>×</Box>
              </Box>
            </Box>

            <div>
              <Box component="h2" sx={{"fontSize":"1.25rem","lineHeight":"1.25","fontWeight":"600","color":"#696CFF"}}>{announcement.title}</Box>
              <Box component="p" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"1rem","lineHeight":"calc(0.25rem * 8)","color":"oklch(44.6% 0.043 257.281)","@media (min-width: 40rem)":{"fontSize":"1.125rem","lineHeight":"calc(1.75 / 1.125)"}}}>{announcement.content}</Box>
            </div>

            <Box component="div" sx={{"display":"flex","flexDirection":"column","gap":"calc(0.25rem * 4)","borderTopStyle":"solid","borderTopWidth":"1px","borderColor":"oklch(96.8% 0.007 247.896)","paddingTop":"calc(0.25rem * 5)"}}>
              <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
                <Box component="div" sx={{"overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"1rem","lineHeight":"calc(1.5 / 1)","fontWeight":"600","color":"oklch(37.2% 0.044 257.287)"}}>{announcement.teacherName}</Box>
                <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>{announcement.createdAtLabel}</Box>
              </Box>
              <Box component="div" sx={{"display":"flex","flexDirection":"column","gap":"calc(0.25rem * 3)","@media (min-width: 40rem)":{"flexDirection":"row","alignItems":"center","justifyContent":"space-between"}}}>
                <Box component="button"
                  type="button"
                  sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(44.6% 0.043 257.281)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media (hover: hover)":{"borderColor":"oklch(86.9% 0.022 252.894)","backgroundColor":"oklch(98.4% 0.003 247.858)","color":"oklch(20.8% 0.042 265.755)"}}}}
                  onClick={handleSnoozeClick}
                >
                  {snoozeLabel}
                </Box>
                <Box component="div" sx={{"display":"flex","flexDirection":"column","gap":"calc(0.25rem * 3)","@media (min-width: 40rem)":{"flexDirection":"row","alignItems":"center"}}}>
                  <Box component="div" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>{autoDismissLabel}</Box>
                  <Box component="div" sx={{"flexShrink":"0","borderRadius":"0.5rem","backgroundColor":"#696CFF","paddingInline":"calc(0.25rem * 5)","paddingBlock":"calc(0.25rem * 3)","color":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
                    <Box component="div" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600"}}>{ctaLabel}</Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box component="div" sx={{"height":"calc(0.25rem * 2)","overflow":"hidden","borderRadius":"9999px","backgroundColor":"oklch(96.8% 0.007 247.896)"}}>
              <Box
                sx={{ bgcolor: "#696CFF", borderRadius: 999, height: "100%" }}
                style={{ animation: "student-announcement-popup-countdown 30s linear forwards" }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
