import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { useFaceConsentMutation, useTimekeepingToday } from "../../api/timekeeping-query";
import type { PunchInput, PunchResult } from "../../api/timekeeping-types";
import { useCameraCapture, type CameraFacing } from "../../hooks/use-camera-capture";
import { useGeolocation } from "../../hooks/use-geolocation";
import { useOnline } from "../../hooks/use-online";
import { useServerClock } from "../../hooks/use-server-clock";
import { useServerNow } from "../../hooks/use-server-now";
import { FaceConsentDialog } from "./face-consent-dialog";
import { PunchCameraFrame } from "./punch-camera-frame";
import { buildPunchChecks, isOutsideZone } from "./punch-checks";
import { PunchChecksList } from "./punch-checks-list";
import { hhmm, minusMinutes } from "./punch-format";
import { resizePhotoFile } from "./punch-photo";
import { PunchSuccessView } from "./punch-success-view";
import { usePunchAttempt } from "./use-punch-attempt";

/** Minutes before the shift end at which the check-out reminder is sent. */
const REMIND_BEFORE_END_MIN = 10;

/** G02: camera + checks, then the punch. G03 replaces the page body once it succeeds. */
export function PunchVerifyPage() {
  const navigate = useNavigate();
  const online = useOnline();
  const clock = useServerClock();
  const serverNow = useServerNow(clock.now);
  const { data: today } = useTimekeepingToday();
  const geo = useGeolocation();
  const requestGps = geo.request;
  const { videoRef, start, stop, capture, supported, fallbackInputProps } = useCameraCapture();
  const consent = useFaceConsentMutation();
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraFacing>("user");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<PunchResult | null>(null);
  // Synchronous guard: attempt.pending only flips once the request starts, after the async photo capture.
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const attempt = usePunchAttempt(() => setConsentGiven(false));

  const needsFace = today?.requireFace !== false;
  const needsConsent = consentGiven === null ? Boolean(today) && needsFace && !today?.faceConsented : !consentGiven;
  const liveCamera = Boolean(today) && needsFace && supported && !needsConsent && !result && !cameraFailed;
  const goHome = () => void navigate({ href: teacherPath("/timekeeping") });
  const go = (href: string) => void navigate({ href });
  const needsGps = Boolean(today) && !today?.remote;

  useEffect(() => {
    if (needsGps) requestGps();
  }, [needsGps, requestGps]);

  useEffect(() => {
    if (!liveCamera) return;
    start(facing).catch(() => {
      setCameraFailed(true);
      setPhotoMessage("Không mở được camera, hãy chọn ảnh từ máy.");
    });
    return stop;
  }, [liveCamera, facing, start, stop]);

  if (result) {
    const end = hhmm(today?.shift?.end);
    return (
      <PunchSuccessView
        onDone={goHome}
        onNavigate={go}
        reminderAt={end ? minusMinutes(end, REMIND_BEFORE_END_MIN) : undefined}
        result={result}
        shiftName={today?.shift?.name}
      />
    );
  }

  const direction = today?.in ? "OUT" : "IN";
  const verb = direction === "IN" ? "vào" : "ra";
  const outside = today ? !today.remote && isOutsideZone(today, geo.reading) : false;
  const rows = today ? buildPunchChecks({ today, geo: geo.reading, geoError: geo.error, photo, serverNow, clockReady: clock.ready }) : [];
  const waitingForGps = needsGps && !geo.reading;
  const waitingForPhoto = needsFace && !photo && !liveCamera;
  const blocked = !online || !today || needsConsent || attempt.pending || submitting || waitingForGps || waitingForPhoto
    || rows.some((row) => row.state === "fail") || (outside && !reason.trim());

  const runPunch = async () => {
    if (!today) return;
    let evidence = photo;
    if (liveCamera && !attempt.isRetry()) {
      try {
        evidence = await capture();
        setPhoto(evidence);
      } catch {
        setPhotoMessage("Chưa chụp được ảnh, thử lại.");
        return;
      }
    }
    const input: PunchInput = { direction, mockReported: false, photo: evidence ?? undefined, reason: outside ? reason.trim() : undefined };
    if (needsGps && geo.reading) Object.assign(input, { lat: geo.reading.lat, lng: geo.reading.lng, accuracyM: geo.reading.accuracyM });
    const done = await attempt.submit(input);
    if (done) {
      stop();
      setResult(done);
    }
  };

  const onPunch = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await runPunch();
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 2, maxWidth: 480, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
      <ErgPageHeader description="Kiểm tra trước khi chấm" title={`Chấm ${verb}`} />
      {needsFace ? (
        <PunchCameraFrame
          error={photoMessage}
          fallbackInputProps={fallbackInputProps}
          hasPhoto={Boolean(photo)}
          live={liveCamera}
          onPickFile={(file) => void resizePhotoFile(file).then((blob) => { setPhoto(blob); setPhotoMessage(null); }, (e: Error) => setPhotoMessage(e.message))}
          onSwitchCamera={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          videoRef={videoRef}
        />
      ) : null}
      <PunchChecksList rows={rows} />
      {geo.error === "timeout" || geo.error === "unavailable" ? (
        <Button onClick={requestGps} variant="outlined">
          Thử lại vị trí
        </Button>
      ) : null}
      {outside ? (
        <ErgTextField label="Lý do chấm ngoài vùng" multiline onChange={(e) => setReason(e.target.value)} required value={reason} />
      ) : null}
      {attempt.error ? <Alert severity="error">{attempt.error}</Alert> : null}
      {!online ? <Alert severity="warning">Cần có mạng để chấm công</Alert> : null}
      <ErgButton disabled={blocked} fullWidth loading={attempt.pending || submitting} onClick={() => void onPunch()} variant="contained">
        {liveCamera ? `Chụp & chấm ${verb}` : `Chấm ${verb}`}
      </ErgButton>
      <Button onClick={() => go(`${teacherPath("/timekeeping/requests")}?new=explanation`)} variant="text">
        Không chấm được? Gửi giải trình
      </Button>
      <FaceConsentDialog
        loading={consent.isPending}
        onAccept={() => consent.mutate(undefined, { onSuccess: () => setConsentGiven(true) })}
        onDecline={goHome}
        open={needsConsent && Boolean(today)}
      />
    </Box>
  );
}
