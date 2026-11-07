import type { SiteView, TodayView } from "../../api/timekeeping-types";
import type { GeoReading } from "../../hooks/use-geolocation";
import { hms } from "./punch-format";

export type CheckRow = {
  id: "location" | "realLocation" | "face" | "serverTime";
  state: "ok" | "pending" | "fail";
  title: string;
  detail: string;
};

const DEFAULT_MAX_ACCURACY_M = 100;
const EARTH_RADIUS_M = 6_371_000;

const GEO_ERROR_DETAIL: Record<string, string> = {
  denied: "Bật quyền vị trí cho trình duyệt để chấm công",
  insecure: "Cần mở trang bằng HTTPS để lấy vị trí",
  timeout: "Lấy vị trí quá lâu, ra chỗ thoáng rồi thử lại",
  unavailable: "Không đọc được vị trí, kiểm tra GPS rồi thử lại",
};
export const geoErrorDetail = (error: string) => GEO_ERROR_DETAIL[error] ?? GEO_ERROR_DETAIL.unavailable;

/** Great-circle distance in metres (haversine). */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Display only: the server decides the verdict from the same nearest-site rule. */
export function nearestSite(sites: readonly SiteView[] | undefined, geo: Pick<GeoReading, "lat" | "lng">) {
  let best: { site: SiteView; distanceM: number } | null = null;
  for (const site of sites ?? []) {
    if (site.lat === undefined || site.lng === undefined) continue;
    const distanceM = Math.round(distanceMeters(geo, { lat: site.lat, lng: site.lng }));
    if (!best || distanceM < best.distanceM) best = { site, distanceM };
  }
  return best;
}

function locationRow(i: { today: TodayView; geo: GeoReading | null; geoError: string | null }): CheckRow {
  const row = (state: CheckRow["state"], detail: string): CheckRow => ({ id: "location", state, title: "Vị trí trong vùng chấm công", detail });
  const { today, geo, geoError } = i;
  if (geoError) return row("fail", geoErrorDetail(geoError));
  if (!geo) return row("pending", "Đang xác định vị trí…");
  const near = nearestSite(today.sites, geo);
  if (!near) return row("fail", "Trường chưa có địa điểm chấm công");
  const maxAccuracy = today.maxAccuracyM ?? DEFAULT_MAX_ACCURACY_M;
  if (geo.accuracyM > maxAccuracy) return row("pending", `GPS chưa chính xác (±${Math.round(geo.accuracyM)} m) · lượt chấm sẽ chờ xem xét`);
  const radius = near.site.radiusM ?? 0;
  const name = near.site.name ?? "địa điểm chấm công";
  if (near.distanceM <= radius) return row("ok", `Trong bán kính ${radius} m · ${name} (${near.distanceM} m)`);
  if (today.allowOutside) return row("pending", `Ngoài vùng ${name} (${near.distanceM} m, tối đa ${radius} m) · cần nhập lý do, lượt chấm chờ duyệt`);
  return row("fail", `Ngoài vùng chấm công · cách ${name} ${near.distanceM} m (tối đa ${radius} m)`);
}

export function buildPunchChecks(i: {
  today: TodayView;
  geo: GeoReading | null;
  geoError: string | null;
  photo: Blob | null;
  serverNow: Date;
}): CheckRow[] {
  const rows: CheckRow[] = [];
  if (!i.today.remote) {
    rows.push(locationRow(i));
    rows.push(
      i.geoError
        ? { id: "realLocation", state: "fail", title: "Vị trí thật", detail: "Chưa đọc được tín hiệu GPS" }
        : i.geo
          ? { id: "realLocation", state: "ok", title: "Vị trí thật", detail: `Tín hiệu GPS từ thiết bị · sai số ±${Math.round(i.geo.accuracyM)} m` }
          : { id: "realLocation", state: "pending", title: "Vị trí thật", detail: "Đang chờ tín hiệu GPS" },
    );
  }
  if (i.today.requireFace !== false) {
    rows.push({
      id: "face",
      state: i.photo ? "ok" : "pending",
      title: "Ảnh khuôn mặt",
      detail: i.photo ? "Ảnh được lưu làm bằng chứng, người duyệt đối chiếu khi cần" : "Chụp ảnh khuôn mặt để chấm công",
    });
  }
  rows.push({
    id: "serverTime",
    state: "ok",
    title: "Giờ máy chủ",
    detail: `${hms(i.serverNow)} · giờ chấm tính theo máy chủ, không theo đồng hồ điện thoại`,
  });
  return rows;
}

/** `shiftName` is lower-cased into "so với ca sáng"; OUT flips the wording (leaving early/late). */
export function minutesVsShiftLabel(min: number, shiftName = "ca sáng", direction: "IN" | "OUT" = "IN"): string {
  if (min === 0) return "Đúng giờ";
  const abs = Math.abs(min);
  if (direction === "OUT") return min < 0 ? `Về sớm ${abs} phút` : `Về muộn ${abs} phút`;
  return min < 0 ? `Sớm ${abs} phút so với ${shiftName.toLowerCase()}` : `Muộn ${abs} phút`;
}

/** True when a fix is outside the nearest site and the policy lets the teacher punch anyway (a reason is then required). */
export function isOutsideZone(today: TodayView, geo: GeoReading | null): boolean {
  if (!geo || !today.allowOutside || geo.accuracyM > (today.maxAccuracyM ?? DEFAULT_MAX_ACCURACY_M)) return false;
  const near = nearestSite(today.sites, geo);
  return near !== null && near.distanceM > (near.site.radiusM ?? 0);
}
