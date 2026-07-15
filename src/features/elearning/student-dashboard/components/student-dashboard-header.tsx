import Box from "@mui/material/Box";
import { useState } from "react";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import { BrandWordmark } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-ui";
import type { ElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";
import type {
  DashboardCopy,
  DiscussionScrollTarget,
  StudentDiscussionNotification,
  StudentPageKey,
} from "@/features/elearning/student-dashboard/types/dashboard-view-types";

export function StudentBrandHeader({
  account,
  activePage,
  announcementUnreadCount,
  copy,
  notifications,
  studentName,
  studentClass,
  onNotificationClick,
  onPageChange,
  onSignIn,
  onSignOut,
}: {
  account: ElearningViewerSession | null;
  activePage: StudentPageKey;
  announcementUnreadCount: number;
  copy: DashboardCopy;
  notifications: StudentDiscussionNotification[];
  studentName: string;
  studentClass: string;
  onNotificationClick: (target: DiscussionScrollTarget) => void;
  onPageChange: (page: StudentPageKey) => void;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);

  return (
    <Box component="header" sx={{"position":"sticky","top":"calc(0.25rem * 0)","zIndex":"30","borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff"}}>
      <Box component="div" sx={{"marginInline":"auto","display":"flex","maxWidth":"1480px","flexDirection":"column","gap":"calc(0.25rem * 3)","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)","@media (min-width: 64rem)":{"flexDirection":"row","alignItems":"center","justifyContent":"space-between"}}}>
        <Box component="div" sx={{"display":"flex","minWidth":"calc(0.25rem * 0)","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 4)"}}>
          <BrandWordmark />
          <Box component="div" sx={{"@media (min-width: 64rem)":{"display":"none"}}}>
            <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 2)"}}>
              <NotificationMenu
                copy={copy}
                menuOpen={notificationMenuOpen}
                notifications={notifications}
                onMenuOpenChange={setNotificationMenuOpen}
                onNotificationClick={(target) => {
                  setNotificationMenuOpen(false);
                  onNotificationClick(target);
                }}
              />
              <ProfileMenu
                account={account}
                copy={copy}
                menuOpen={accountMenuOpen}
                studentClass={studentClass}
                studentName={studentName}
                onMenuOpenChange={setAccountMenuOpen}
                onPageChange={onPageChange}
                onSignIn={onSignIn}
                onSignOut={onSignOut}
              />
            </Box>
          </Box>
        </Box>

        <Box component="nav" sx={{"display":"flex","gap":"calc(0.25rem * 1)","overflowX":"auto","paddingBottom":"calc(0.25rem * 1)","@media (min-width: 64rem)":{"paddingBottom":"calc(0.25rem * 0)"}}}>
          {copy.navItems.map((item) => (
            <Box component="button"
              key={item.key}
              type="button"
              sx={{ alignItems: "center", bgcolor: "background.paper", border: "1px solid", borderColor: activePage === item.key ? "rgba(105,108,255,0.24)" : "transparent", borderRadius: 1, boxShadow: activePage === item.key ? 1 : 0, color: activePage === item.key ? "#696CFF" : "text.secondary", display: "inline-flex", flexShrink: 0, fontSize: 14, fontWeight: 700, gap: 1, height: 36, px: 1.5, position: "relative", transition: "border-color 160ms ease, color 160ms ease", ...(activePage === item.key ? { "&::after": { bgcolor: "#696CFF", borderRadius: 999, bottom: -4, content: '\"\"', height: 2, left: 12, position: "absolute", right: 12 } } : { "&:hover": { borderColor: "#d9e0ea", color: "#696CFF" } }) }}
              onClick={() => onPageChange(item.key)}
            >
              {item.icon}
              {item.label}
              {item.key === "announcements" && announcementUnreadCount > 0 ? (
                <Box component="span" sx={{"display":"grid","minWidth":"calc(0.25rem * 5)","placeItems":"center","borderRadius":"9999px","backgroundColor":"#FF5630","paddingInline":"calc(0.25rem * 1.5)","paddingBlock":"calc(0.25rem * 0.5)","fontSize":"10px","fontWeight":"500","color":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
                  {announcementUnreadCount}
                </Box>
              ) : null}
            </Box>
          ))}
        </Box>

        <Box component="div" sx={{"display":"none","@media (min-width: 64rem)":{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 2)"}}}>
          <NotificationMenu
            copy={copy}
            menuOpen={notificationMenuOpen}
            notifications={notifications}
            onMenuOpenChange={setNotificationMenuOpen}
            onNotificationClick={(target) => {
              setNotificationMenuOpen(false);
              onNotificationClick(target);
            }}
          />
          <ProfileMenu
            account={account}
            copy={copy}
            menuOpen={accountMenuOpen}
            studentClass={studentClass}
            studentName={studentName}
            onMenuOpenChange={setAccountMenuOpen}
            onPageChange={onPageChange}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
          />
        </Box>
      </Box>
    </Box>
  );
}

function ProfileMenu({
  account,
  copy,
  menuOpen,
  studentClass,
  studentName,
  onMenuOpenChange,
  onPageChange,
  onSignIn,
  onSignOut,
}: {
  account: ElearningViewerSession | null;
  copy: DashboardCopy;
  menuOpen: boolean;
  studentClass: string;
  studentName: string;
  onMenuOpenChange: (open: boolean) => void;
  onPageChange: (page: StudentPageKey) => void;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const initial = studentName.trim().slice(0, 1).toUpperCase();
  const signedInLabel = account ? copy.signedInAs : copy.guestLabel;

  function handleAccountClick() {
    onPageChange("account");
    onMenuOpenChange(false);
  }

  function handleAuthClick() {
    onMenuOpenChange(false);
    if (account) {
      onSignOut();
      return;
    }
    onSignIn();
  }

  return (
    <Box component="div" sx={{"position":"relative"}}>
      <Box component="button"
        type="button"
        aria-expanded={menuOpen}
        sx={{ alignItems: "center", bgcolor: "background.paper", border: "1px solid", borderColor: menuOpen ? "rgba(105,108,255,0.24)" : "#d7e0ec", borderRadius: 1, boxShadow: menuOpen ? "0 0 0 2px rgba(105,108,255,0.24)" : 1, color: menuOpen ? "#696CFF" : "inherit", display: "flex", gap: 1, minWidth: 148, px: 1, py: 0.75, textAlign: "left", transition: "border-color 160ms ease, box-shadow 160ms ease", "&:hover": { borderColor: "rgba(105,108,255,0.24)" } }}
        onClick={() => onMenuOpenChange(!menuOpen)}
      >
        <Box component="span" sx={{"display":"grid","height":"calc(0.25rem * 8)","width":"calc(0.25rem * 8)","flexShrink":"0","placeItems":"center","borderRadius":"0.375rem","backgroundColor":"#696CFF","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"#fff"}}>
          {initial}
        </Box>
        <Box component="span" sx={{"minWidth":"calc(0.25rem * 0)","flex":"1"}}>
          <Box component="span" sx={{"display":"block","maxWidth":"98px","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 4)","fontWeight":"600","color":"#696CFF"}}>{studentName}</Box>
          <Box component="span" sx={{"marginTop":"calc(0.25rem * 0.5)","display":"flex","alignItems":"center","gap":"calc(0.25rem * 1.5)","fontSize":"11px","lineHeight":"calc(0.25rem * 4)","color":"oklch(55.4% 0.046 257.417)"}}>
            <span>{studentClass}</span>
            <Box component="span" sx={{"height":"calc(0.25rem * 0.5)","width":"calc(0.25rem * 0.5)","borderRadius":"9999px","backgroundColor":"oklch(86.9% 0.022 252.894)"}} />
            <Box component="span" sx={{"maxWidth":"76px","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap"}}>{signedInLabel}</Box>
          </Box>
        </Box>
        <ExpandMoreOutlinedIcon sx={{ flexShrink: 0, color: "text.disabled", fontSize: 16, transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 160ms ease" }} />
      </Box>

      {menuOpen ? (
        <Box sx={{ bgcolor: "background.paper", border: "1px solid #d7e0ec", borderRadius: 1, boxShadow: 1, overflow: "hidden", position: "absolute", right: 0, top: "calc(100% + 8px)", width: 260, zIndex: 50 }}>
          <Box component="div" sx={{"borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"#edf1f5","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)"}}>
            <Box component="div" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(12.9% 0.042 264.695)"}}>{studentName}</Box>
            <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","color":"oklch(55.4% 0.046 257.417)"}}>{studentClass}</Box>
          </Box>

          <Box component="div" sx={{"display":"grid","gap":"calc(0.25rem * 1)","padding":"calc(0.25rem * 2)"}}>
            <Box component="button"
              type="button"
              sx={{ alignItems: "center", bgcolor: "transparent", border: 0, borderRadius: 1, color: "text.secondary", display: "flex", fontSize: 14, fontWeight: 700, gap: 1.5, px: 1.5, py: 1, "&:hover": { bgcolor: "rgba(105,108,255,0.08)", color: "#696CFF" } }}
              onClick={handleAccountClick}
            >
              <SettingsOutlinedIcon sx={{ fontSize: 16 }} />
              {copy.accountTitle}
            </Box>
            <Box component="button"
              type="button"
              sx={{ alignItems: "center", bgcolor: "transparent", border: 0, borderRadius: 1, color: account ? "#FF5630" : "#696CFF", display: "flex", fontSize: 14, fontWeight: 700, gap: 1.5, px: 1.5, py: 1, "&:hover": { bgcolor: "rgba(105,108,255,0.08)" } }}
              onClick={handleAuthClick}
            >
              {account ? <LogoutOutlinedIcon sx={{ fontSize: 16 }} /> : <LoginOutlinedIcon sx={{ fontSize: 16 }} />}
              {account ? copy.signOut : copy.signIn}
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function NotificationMenu({
  copy,
  menuOpen,
  notifications,
  onMenuOpenChange,
  onNotificationClick,
}: {
  copy: DashboardCopy;
  menuOpen: boolean;
  notifications: StudentDiscussionNotification[];
  onMenuOpenChange: (open: boolean) => void;
  onNotificationClick: (target: DiscussionScrollTarget) => void;
}) {
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  return (
    <Box component="div" sx={{"position":"relative"}}>
      <Box component="button"
        type="button"
        aria-expanded={menuOpen}
        aria-label={copy.notificationTitle}
        sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: menuOpen ? "rgba(105,108,255,0.24)" : "#d7e0ec", borderRadius: 1, boxShadow: menuOpen ? "0 0 0 2px rgba(105,108,255,0.24)" : 1, color: "#696CFF", display: "grid", height: 40, placeItems: "center", position: "relative", width: 40, "&:hover": { borderColor: "rgba(105,108,255,0.24)" } }}
        onClick={() => onMenuOpenChange(!menuOpen)}
      >
        <NotificationsNoneOutlinedIcon sx={{ fontSize: 16 }} />
        {unreadCount > 0 ? (
          <Box component="span" sx={{"position":"absolute","right":"calc(0.25rem * -1)","top":"calc(0.25rem * -1)","display":"grid","height":"calc(0.25rem * 5)","minWidth":"calc(0.25rem * 5)","placeItems":"center","borderRadius":"9999px","backgroundColor":"#FF5630","paddingInline":"calc(0.25rem * 1)","fontSize":"10px","fontWeight":"600","color":"#fff"}}>
            {unreadCount}
          </Box>
        ) : null}
      </Box>

      {menuOpen ? (
        <Box sx={{ bgcolor: "background.paper", border: "1px solid #d7e0ec", borderRadius: 1, boxShadow: 1, overflow: "hidden", position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320, zIndex: 50 }}>
          <Box component="div" sx={{"borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"#edf1f5","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)"}}>
            <Box component="div" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"#696CFF"}}>{copy.notificationTitle}</Box>
          </Box>
          <Box component="div" sx={{"maxHeight":"360px","overflowY":"auto","padding":"calc(0.25rem * 2)"}}>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Box component="button"
                  key={notification.id}
                  type="button"
                  sx={{ bgcolor: notification.unread ? "rgba(105,108,255,0.05)" : "background.paper", border: 0, borderRadius: 1, px: 1.5, py: 1, textAlign: "left", width: "100%", "&:hover": { bgcolor: "rgba(105,108,255,0.08)" } }}
                  onClick={() =>
                    onNotificationClick({
                      replyId: notification.replyId,
                      threadId: notification.threadId,
                    })
                  }
                >
                  <Box component="div" sx={{"display":"flex","alignItems":"flex-start","gap":"calc(0.25rem * 2)"}}>
                    <Box component="span" sx={{ bgcolor: notification.unread ? "#FF5630" : "#cbd5e1", borderRadius: "50%", flexShrink: 0, height: 8, mt: 0.5, width: 8 }} />
                    <Box component="span" sx={{"minWidth":"calc(0.25rem * 0)"}}>
                      <Box component="span" sx={{"display":"block","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 5)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>
                        {notification.primaryText}
                      </Box>
                      <Box component="span" sx={{"marginTop":"calc(0.25rem * 0.5)","display":"block","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"0.75rem","lineHeight":"calc(0.25rem * 5)","color":"oklch(55.4% 0.046 257.417)"}}>
                        {notification.secondaryText}
                      </Box>
                      <Box component="span" sx={{"marginTop":"calc(0.25rem * 1)","display":"block","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","color":"oklch(55.4% 0.046 257.417)"}}>{notification.timeLabel}</Box>
                    </Box>
                  </Box>
                </Box>
              ))
            ) : (
              <Box component="div" sx={{"paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 6)","textAlign":"center","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>{copy.notificationEmpty}</Box>
            )}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
