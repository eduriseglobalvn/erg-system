import Box from "@mui/material/Box";
import { useRef, useState } from "react";

import { HackButton, HackScreen, Panel, WindowTitle } from "@/features/games/hack/ui/hack-ui";
import { hk } from "@/features/games/hack/hack-tokens";

const c = hk.color;
const CODE_LENGTH = 4;

type JoinScreenProps = {
  phone: boolean;
  studentName?: string | null;
  busy?: boolean;
  /** Message of the last failed attempt; stays on this screen. */
  error?: string | null;
  onSubmit: (code: string) => void;
};

/** 01 · Nhập mã phòng (HJoin / HPJoin). */
export function JoinScreen({ phone, studentName, busy, error, onSubmit }: JoinScreenProps) {
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const ready = code.length === CODE_LENGTH;
  const submit = () => { if (ready && !busy) onSubmit(code); };

  const digits = (
    <Box sx={{ position: "relative", display: "flex", gap: phone ? "8px" : "12px" }}>
      {Array.from({ length: CODE_LENGTH }, (_, index) => {
        const digit = code[index];
        const active = index === code.length;
        return (
          <Box
            key={index}
            aria-hidden="true"
            sx={{
              flex: 1,
              height: phone ? "84px" : "96px",
              border: `2px solid ${active ? c.yellow : digit ? c.green : c.border}`,
              borderRadius: `${hk.radius.panel}px`,
              bgcolor: c.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: phone ? hk.fs[46] : hk.fs[56],
              fontWeight: hk.font.weightBold,
              color: c.white,
            }}
          >
            {digit ?? (active ? <Box component="span" sx={{ width: phone ? "24px" : "28px", height: phone ? "5px" : "6px", bgcolor: c.yellow }} /> : null)}
          </Box>
        );
      })}
      {/* Real input on top: keeps the numeric keypad, paste and screen readers working. */}
      <Box
        component="input"
        ref={inputRef}
        id="join-code"
        aria-label="Mã phòng (4 số)"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        value={code}
        autoFocus
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
        onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "text", fontSize: hk.fs[20] }}
      />
    </Box>
  );

  const errorLine = error ? <Box role="alert" sx={{ fontSize: phone ? hk.fs[12] : hk.fs[13], lineHeight: phone ? 1.6 : undefined, color: c.pink }}>{error}</Box> : null;
  const qrLine = (
    <Box sx={{ fontSize: hk.fs[12], lineHeight: phone ? 1.6 : undefined, color: c.dim }}>
      {phone ? "Quét mã QR trên bảng thì vào thẳng phòng chờ." : "Quét mã QR trên bảng thì vào thẳng phòng chờ, bỏ qua bước này."}
    </Box>
  );
  const button = (
    <HackButton disabled={!ready || busy} onClick={submit} fullWidth fontSize={phone ? hk.fs[17] : hk.fs[20]} minHeight={phone ? 56 : 60} sx={phone ? { marginTop: "auto" } : undefined}>
      {phone ? "> KẾT NỐI (đủ 4 số)" : "> KẾT NỐI (nhập đủ 4 số)"}
    </HackButton>
  );

  if (phone) {
    return (
      <HackScreen phone label="Nhập mã phòng" sx={{ gap: "14px", padding: "70px 14px 16px" }}>
        <Box sx={{ position: "relative", fontSize: hk.fs[30], fontWeight: hk.font.weightBold, color: c.green, lineHeight: 1.2 }}>KẾT NỐI<br />VÀO PHÒNG</Box>
        <Panel sx={{ padding: "12px 14px", fontSize: hk.fs[13], lineHeight: 1.8 }}>
          <Box component="span" sx={{ color: c.green }}>[OK]</Box> đã đăng nhập LMS:<br />
          {studentName ? <><Box component="span" sx={{ color: c.white, fontWeight: hk.font.weightBold }}>{studentName}</Box><br /></> : null}
          <Box component="span" sx={{ color: c.green }}>$</Box> nhập mã cô chiếu trên bảng
        </Panel>
        <Box component="label" htmlFor="join-code" sx={{ position: "relative", fontSize: hk.fs[12], fontWeight: hk.font.weightBold, color: c.dim }}>MÃ PHÒNG (4 SỐ)</Box>
        {digits}
        {errorLine}
        {qrLine}
        {button}
      </HackScreen>
    );
  }

  return (
    <HackScreen phone={false} center label="Nhập mã phòng">
      <Panel sx={{ width: "620px", maxWidth: "calc(100% - 32px)" }}>
        <WindowTitle>{`${window.location.host}/student/games`}</WindowTitle>
        <Box sx={{ padding: "28px 32px 30px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <Box sx={{ fontSize: hk.fs[34], fontWeight: hk.font.weightBold, color: c.green, lineHeight: 1.2 }}>KẾT NỐI VÀO PHÒNG</Box>
          <Box sx={{ fontSize: hk.fs[14], lineHeight: 1.8 }}>
            <Box component="span" sx={{ color: c.green }}>[OK]</Box> đã đăng nhập LMS{studentName ? ": " : ""}
            {studentName ? <Box component="span" sx={{ color: c.white, fontWeight: hk.font.weightBold }}>{studentName}</Box> : null}
            <br />
            <Box component="span" sx={{ color: c.green }}>$</Box> nhập mã phòng cô giáo chiếu trên bảng
          </Box>
          <Box component="label" htmlFor="join-code" sx={{ fontSize: hk.fs[12], fontWeight: hk.font.weightBold, color: c.dim }}>MÃ PHÒNG (4 SỐ)</Box>
          {digits}
          {errorLine}
          {button}
          {qrLine}
        </Box>
      </Panel>
    </HackScreen>
  );
}
