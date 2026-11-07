import type { PunchResult, TodayView } from "@/features/timekeeping/api/timekeeping-types";

export const SITE = { id: "s1", name: "Cơ sở Cầu Giấy", lat: 21.0285, lng: 105.8542, radiusM: 150 };

export const TODAY: TodayView = {
  allowOutside: false,
  date: "2026-11-06",
  faceConsented: true,
  maxAccuracyM: 100,
  periodLocked: false,
  periods: [{}, {}, {}],
  remote: false,
  requireFace: true,
  shift: { id: "sh1", name: "Ca sáng", start: "07:30:00", end: "11:30:00", workUnits: 1 },
  sites: [SITE],
};

/** About 38 m north of the site. */
export const NEARBY_FIX = { lat: SITE.lat + 0.000342, lng: SITE.lng, accuracyM: 20, at: 0 };

export const PUNCH_RESULT: PunchResult = {
  alreadyPunched: false,
  minutesVsShift: -6,
  punch: { code: "CC-0001", direction: "IN", distanceM: 38, method: "GPS_FACE", remote: false, serverTime: "2026-11-06T07:24:00+07:00", siteName: SITE.name, status: "VALID" },
  verdict: "VALID",
};
