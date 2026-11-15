import { useState, type KeyboardEvent } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgTextField } from "@/components/erg-mui/erg-form";
import type { TeachingSlotOptions } from "@/features/teaching-calendar/api/teaching-calendar-slot-options-api";
import { PickTag } from "./pick-tag";

type Room = TeachingSlotOptions["rooms"][number];

type Props = {
  className: string;
  onClose: () => void;
  /** `room` co san, hoac `newRoomName` de tao phong khi luu nhap. */
  onSelect: (value: { id?: string; name: string; isNew?: boolean }) => void;
  rooms: readonly Room[];
  schoolName: string;
  value?: string;
};

const normalize = (value: string) => value.normalize("NFC").replace(/\s+/g, "").toLocaleLowerCase("vi");

function detail(room: Room, className: string) {
  if (room.state === "BUSY" && room.busy) {
    const taught = [room.busy.subjectName, room.busy.className].filter(Boolean).join(" ");
    return [room.busy.teacherName ? `${room.busy.teacherName} dạy ${taught}` : taught, room.busy.batchLabel].filter(Boolean).join(" · ");
  }
  return [room.seatCount ? `${room.seatCount} máy` : "", room.usualForClass ? `lớp ${className} hay học phòng này` : "trống tiết này"].filter(Boolean).join(" · ");
}

/** AdminRoomPick (6.4): go de loc, Enter chon dong dang sang, «+ Thêm phòng» luu `newRoomName`. */
export function RoomPick({ className, onClose, onSelect, rooms, schoolName, value = "" }: Props) {
  const [query, setQuery] = useState(value);
  const [cursor, setCursor] = useState(0);
  const text = query.trim();
  const matches = rooms.filter((room) => normalize(room.roomName).includes(normalize(text)));
  const exact = rooms.some((room) => normalize(room.roomName) === normalize(text));
  const canAdd = Boolean(text) && !exact;
  const total = matches.length + (canAdd ? 1 : 0);

  const choose = (position: number) => {
    if (position < matches.length) onSelect({ id: matches[position].roomId, name: matches[position].roomName });
    else if (canAdd) onSelect({ isNew: true, name: text });
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setCursor((current) => Math.min(current + 1, total - 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setCursor((current) => Math.max(current - 1, 0)); }
    else if (event.key === "Enter") { event.preventDefault(); choose(cursor); }
    else if (event.key === "Escape") { event.stopPropagation(); onClose(); }
  };

  return (
    <Stack onKeyDown={onKeyDown} sx={{ width: { sm: 440, xs: "100%" } }}>
      <Box sx={{ p: 1.5 }}>
        <ErgTextField autoFocus compact label="Phòng học" onChange={(event) => { setQuery(event.target.value); setCursor(0); }} value={query} />
      </Box>
      <Box role="listbox" sx={{ maxHeight: 360, overflowY: "auto" }}>
        {!matches.length && text ? (
          <Typography sx={{ color: "text.secondary", px: 1.5, py: 1, typography: "caption" }}>Chưa có “{text}” · phòng hiện có của {schoolName}</Typography>
        ) : null}
        {matches.map((room, index) => (
          <ButtonBase key={room.roomId} onClick={() => choose(index)} onMouseEnter={() => setCursor(index)} role="option" sx={{ alignItems: "center", bgcolor: cursor === index ? "action.hover" : "transparent", gap: 1, px: 1.5, py: 1, textAlign: "left", width: "100%" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ typography: "body2" }}>{room.roomName}</Typography>
              <Typography sx={{ color: "text.secondary", typography: "caption" }}>{detail(room, className)}</Typography>
            </Box>
            <PickTag label={room.state === "BUSY" ? "Bận" : "Trống"} tone={room.state === "BUSY" ? "busy" : "free"} />
          </ButtonBase>
        ))}
        {canAdd ? (
          <ButtonBase onClick={() => choose(matches.length)} onMouseEnter={() => setCursor(matches.length)} role="option" sx={{ bgcolor: cursor === matches.length ? "action.hover" : "transparent", color: "primary.main", px: 1.5, py: 1, textAlign: "left", typography: "body2", width: "100%", justifyContent: "flex-start" }}>
            + Thêm phòng “{text}” vào {schoolName}
          </ButtonBase>
        ) : null}
      </Box>
      <Typography sx={{ borderTop: 1, borderColor: "divider", color: "text.secondary", p: 1.5, typography: "caption" }}>
        Gõ để lọc danh sách. Không có phòng trùng tên thì chọn “+ Thêm phòng”, phòng mới được lưu vào danh sách của trường khi lưu tiết. Enter = chọn dòng đang sáng.
      </Typography>
    </Stack>
  );
}
