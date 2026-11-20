// DEV ONLY: /teacher/games/preview?screen=<lobby|live|paused|countdown|ended|cancelled|picker|settings|arena> renders one teacher screen
// from fixed data, without a socket or backend. Reached through a dynamic import behind import.meta.env.DEV, so it is not in production builds.
import { useState } from "react";

import type { GameSource, RoomSummary } from "@/features/games/game-types";
import { HackThemeProvider } from "@/features/games/hack/hack-theme";
import { initialRoomViewState, type RoomViewState } from "@/features/games/room-state";
import { HostRoomView } from "@/features/games/teacher/host-room";
import { GamesView } from "@/features/games/teacher/games-page";
import { PickerStep } from "@/features/games/teacher/picker-step";
import { DEFAULT_SETTINGS, validateSettings, type RoomSettings } from "@/features/games/teacher/room-settings";
import { SettingsStep } from "@/features/games/teacher/settings-step";

const room: RoomSummary = {
  id: "preview", gameType: "HACK", code: "4253", status: "RUNNING", classId: "c1", className: "7A2", quizId: "q1", quizVersionId: "v1", quizTitle: "IC3 GS6 Level 1: Tệp, thư mục và định dạng tệp", questionSet: "ALL",
  durationMinutes: 15, rules: { allowHack: false, emergencyPatch: false, showLeaderboard: true, showSolution: true, allowLateJoin: true, questionOrder: "LESSON" },
  playerCount: 28, questionCount: 20, accuracy: null, createdAt: "2026-11-21T09:15:00",
};
const names = ["MINH_ANH", "HOANG_BAO", "THU_KHANH", "GIA_HUY", "PHUONG_LINH", "DUC_TRI", "VAN_HA", "KHANH_LY", "QUOC_AN", "BAO_NGOC", "TUAN_KIET", "MY_DUYEN", "ANH_KHOA", "THAO_VY", "TRUNG_HIEU", "NGOC_HAN", "DANG_KHOI", "KIM_NGAN"];
const lobby = { players: names.map((displayName, index) => ({ playerId: `p${index}`, displayName })), count: 28, classSize: 32, missing: ["Nhật Minh", "Bảo Trân", "Hải Đăng", "Yến Nhi"].map((displayName, index) => ({ userId: `m${index}`, displayName })) };
const top = [["HOANG_BAO", 3200, 2280], ["THU_KHANH", 3000, 2120], ["GIA_HUY", 2400, 1440], ["MINH_ANH", 1900, 1040], ["PHUONG_LINH", 1700, 780], ["DUC_TRI", 1500, 810], ["VAN_HA", 1400, 690], ["KHANH_LY", 1300, 570]].map(([displayName, stars, coins], index) => ({
  playerId: `p${index}`, displayName: String(displayName), stars: Number(stars), coins: Number(coins), total: Number(stars) + Number(coins), rank: index + 1, firewall: index === 1,
}));
const stats = {
  answeredTotal: 612, accuracy: 0.74, playersOnline: 32, playerCount: 32, avgProgress: 11, questionTotal: 20, firewallOn: 6, hackWins: 23,
  perQuestion: [
    { questionId: "a", title: "Sắp xếp các bước nén một thư mục", wrongRate: 0.59, wrongPlayers: 19, answeredPlayers: 32 },
    { questionId: "b", title: "Xóa tệp trên USB có vào Thùng rác không", wrongRate: 0.44, wrongPlayers: 14, answeredPlayers: 32 },
    { questionId: "c", title: "Ghép phần mở rộng với ứng dụng", wrongRate: 0.34, wrongPlayers: 11, answeredPlayers: 32 },
    { questionId: "d", title: "Đơn vị nhỏ nhất lưu thông tin", wrongRate: 0.05, wrongPlayers: 2, answeredPlayers: 30 },
  ],
};
const finalRows = top.map((entry) => ({ ...entry, correctCount: 17, answeredCount: 20, longestStreak: 6 }));

const sources: GameSource = { quizVersionId: "v1", quizId: "q1", title: "Tin 7 · Bài 4: Quản lý tệp và thư mục", versionNumber: 1, publishedAt: "2026-11-18T00:00:00Z", questionCount: 24, playableCount: 22, filteredCount: 2, filteredByKind: { essay: 1, likert_scale: 1 }, classSize: 34, classWrongCount: 6, lastGame: null };
const rooms: RoomSummary[] = [
  { ...room, id: "r1", status: "LOBBY", quizTitle: "Bài 4: Quản lý tệp và thư mục", durationMinutes: 8, className: "7A2" },
  { ...room, id: "r2", status: "ENDED", quizTitle: "Bài 4: Quản lý tệp và thư mục", durationMinutes: 8, accuracy: 0.64, createdAt: "2026-11-18T10:00:00" },
  { ...room, id: "r3", status: "ENDED", quizTitle: "Ôn tập giữa kỳ 1", durationMinutes: 10, className: "7A1", accuracy: 0.78, createdAt: "2026-11-12T10:00:00" },
  { ...room, id: "r4", status: "CANCELLED", quizTitle: "Ôn tập giữa kỳ 1", durationMinutes: 10, className: "7A3", createdAt: "2026-11-10T10:00:00" },
];

function states(): Record<string, RoomViewState> {
  const now = Date.now();
  const base: RoomViewState = { ...initialRoomViewState, connection: "open", lastSeq: 5, clockOffsetMs: 0, lobby, leaderboard: { top, me: { rank: 0, total: 0 } }, stats };
  const live: RoomViewState = {
    ...base, phase: "RUNNING", screen: null, endsAt: now + 6 * 60_000 + 48_000,
    feed: [
      { at: new Date(now - 60_000).toISOString(), text: "GIA_HUY giải mã kho mật +1 600 xu", tone: "loot" },
      { at: new Date(now - 120_000).toISOString(), text: "THU_KHANH bật tường lửa (chuỗi x3)", tone: "firewall" },
      { at: new Date(now - 180_000).toISOString(), text: "DUC_TRI vượt câu khó", tone: "info" },
    ],
  };
  return {
    lobby: { ...base, phase: "LOBBY" },
    live,
    paused: { ...live, phase: "PAUSED", pausedRemainingMs: 6 * 60_000 + 48_000 },
    countdown: { ...base, phase: "COUNTDOWN", countdownStartsAt: now + 3_000 },
    ended: { ...base, phase: "ENDED", screen: "ENDED", ended: { final: finalRows } },
    cancelled: { ...base, phase: "CANCELLED" },
  };
}

function Light({ screen }: { screen: string }) {
  const [settings, setSettings] = useState<RoomSettings>({ ...DEFAULT_SETTINGS, classId: "c1", durationMinutes: 8 });
  const [step, setStep] = useState(screen === "settings" ? 1 : 0);
  if (screen === "arena") return <div style={{ padding: 24, maxWidth: 1100 }}><GamesView rooms={rooms} loading={false} onNew={() => undefined} onEnter={() => undefined} onReplay={() => undefined} /></div>;
  const classes = [{ id: "c1", label: "7A2" }, { id: "c2", label: "7A1" }];
  return step === 0
    ? <PickerStep quizTitle={sources.title} source={sources} loading={false} onBack={() => undefined} onNext={() => setStep(1)} />
    : <SettingsStep settings={settings} classes={classes} source={sources} problem={validateSettings(settings, sources)} failure={null} busy={false} onChange={setSettings} onBack={() => setStep(0)} onSubmit={() => undefined} />;
}

export default function PreviewTeacher() {
  const screen = new URLSearchParams(window.location.search).get("screen") ?? "live";
  if (screen === "picker" || screen === "settings" || screen === "arena") return <Light screen={screen} />;
  const state = states()[screen] ?? states().live;
  const allowHack = new URLSearchParams(window.location.search).get("hack") !== "0";
  const view = { ...room, status: state.phase ?? "RUNNING", rules: { ...room.rules, allowHack } };
  return (
    <HackThemeProvider>
      <HostRoomView state={state} room={view} teacherLabel="admin@co_lan" joinUrl="lms.erg.edu.vn/student/games" send={() => true} onExit={() => undefined} />
    </HackThemeProvider>
  );
}
