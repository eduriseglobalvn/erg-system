import AddIcon from "@mui/icons-material/Add";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PanoramaFishEyeIcon from "@mui/icons-material/PanoramaFishEye";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useRef, useState, type DragEvent, type PointerEvent } from "react";
import { toast } from "sonner";

import type { HotspotArea, Question } from "@/domain/quiz/types";
import { prepareQuizImage, QUIZ_IMAGE_TYPES, QuizImageRejectedError } from "@/lib/media/quiz-image";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { HotspotAreaMark, HotspotAreaToolbar } from "./hotspot-area-mark";
import { areaFromDrag, toFraction, type Fraction } from "./hotspot-geometry";
import { QuestionImageSlot, type ImageSize } from "./question-image-slot";
import { newRowId, usePendingFocus } from "./sortable-rows";

type Shape = "rect" | "ellipse";
const HINT = "Kéo trên ảnh để vẽ vùng. Bấm vào vùng: chọn Đúng / Nhiễu / Xoá. Kéo ảnh mới vào để thay.";

/** Teacher view of a hotspot question (spec 7.1 card 13): draw areas on the image, mark each correct or a distractor. */
export function HotspotAuthoring({ question, onUpdate }: {
  question: Question;
  /** Applies a change to the latest question, so an image picked while areas change keeps them. */
  onUpdate: (change: (latest: Question) => Question) => void;
}) {
  const [shape, setShape] = useState<Shape>("rect");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ pointerId: number; start: Fraction; end: Fraction } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { rootRef, focusLater } = usePendingFocus();
  const areas = question.hotspotAreas ?? [];

  const setImage = (url: string, size?: ImageSize) =>
    onUpdate((latest) => ({ ...latest, hotspotImage: { url, width: size?.width ?? 1200, height: size?.height ?? 675 } }));
  const take = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { dataUrl, width, height } = await prepareQuizImage(file);
      setImage(dataUrl, { width, height });
    } catch (error) {
      toast.error(error instanceof QuizImageRejectedError ? error.message : "Không đọc được ảnh.");
    }
  };

  const updateAreas = (change: (list: HotspotArea[]) => HotspotArea[]) =>
    onUpdate((latest) => ({ ...latest, hotspotAreas: change(latest.hotspotAreas ?? []) }));
  const append = (box: Pick<HotspotArea, "x" | "y" | "width" | "height">) => {
    const id = newRowId("area");
    updateAreas((list) => [...list, { id, shape, ...box, correct: true }]);
    setSelectedId(id);
    return id;
  };
  const remove = (id: string) => {
    const index = areas.findIndex((area) => area.id === id);
    const neighbour = areas[index + 1] ?? areas[index - 1];
    focusLater(neighbour ? `[data-area-id="${neighbour.id}"]` : "[data-add-area]");
    updateAreas((list) => list.filter((area) => area.id !== id));
    setSelectedId(null);
  };

  if (!question.hotspotImage) {
    return <QuestionImageSlot label="Thêm ảnh cho câu hỏi điểm nóng" media={null} onChange={(media, size) => { if (media) setImage(media.src, size); }} />;
  }

  const pointAt = (event: PointerEvent) => toFraction(event.clientX, event.clientY, imageRef.current!.getBoundingClientRect());
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Presses on a mark or the area toolbar are theirs, not the start of a drawing; only one primary-button pointer draws.
    if (event.target !== event.currentTarget || event.button !== 0 || (draft && draft.pointerId !== event.pointerId)) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const start = pointAt(event);
    setDraft({ pointerId: event.pointerId, start, end: start });
  };
  const onPointerUp = (event: PointerEvent) => {
    if (draft?.pointerId !== event.pointerId) return;
    const box = areaFromDrag(draft.start, pointAt(event));
    setDraft(null);
    if (box) append(box);
    else setSelectedId(null);
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    void take(event.dataTransfer.files[0]);
  };

  const selectedIndex = areas.findIndex((area) => area.id === selectedId);
  const selected = areas[selectedIndex];

  return (
    <Box ref={rootRef} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
        <ToggleButtonGroup aria-label="Hình vùng" exclusive onChange={(_, value: Shape | null) => { if (value) setShape(value); }} size="small" value={shape}>
          <ToggleButton sx={{ gap: 0.5 }} value="rect"><CropSquareIcon fontSize="small" />Chữ nhật</ToggleButton>
          <ToggleButton sx={{ gap: 0.5 }} value="ellipse"><PanoramaFishEyeIcon fontSize="small" />Elip</ToggleButton>
        </ToggleButtonGroup>
        <Button
          data-add-area
          onClick={() => focusLater(`[data-area-id="${append({ x: 0.35, y: 0.4, width: 0.3, height: 0.2 })}"]`)}
          startIcon={<AddIcon />}
          variant="text"
        >
          Thêm vùng
        </Button>
        <Button onClick={() => fileRef.current?.click()} startIcon={<ImageOutlinedIcon />} variant="text">Đổi ảnh</Button>
        <input
          accept={QUIZ_IMAGE_TYPES.join(",")}
          aria-label="Ảnh điểm nóng"
          hidden
          onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void take(file); }}
          ref={fileRef}
          type="file"
        />
      </Box>
      <Box sx={{ typography: "caption", color: "text.secondary" }}>{HINT}</Box>
      <Box sx={{ position: "relative", display: "inline-block", alignSelf: "flex-start", maxWidth: "100%", lineHeight: 0 }}>
        <Box
          alt={question.title}
          component="img"
          draggable={false}
          ref={imageRef}
          src={question.hotspotImage.url}
          sx={{ display: "block", maxWidth: "100%", maxHeight: 480, borderRadius: `${tokens.radius.control}px` }}
        />
        <Box
          data-testid="hotspot-draw-layer"
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          onLostPointerCapture={() => setDraft(null)}
          onPointerCancel={() => setDraft(null)}
          onPointerDown={onPointerDown}
          onPointerMove={(event) => { if (draft?.pointerId === event.pointerId) setDraft({ ...draft, end: pointAt(event) }); }}
          onPointerUp={onPointerUp}
          sx={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}
        >
          {areas.map((area, index) => (
            <HotspotAreaMark
              area={area}
              key={area.id}
              n={index + 1}
              onClearSelection={() => setSelectedId(null)}
              onRemove={() => remove(area.id)}
              onSelect={() => setSelectedId(area.id)}
              selected={area.id === selectedId}
            />
          ))}
          {draft ? <DraftShape draft={draft} shape={shape} /> : null}
          {selected ? (
            <HotspotAreaToolbar
              area={selected}
              n={selectedIndex + 1}
              onCorrectChange={(correct) => updateAreas((list) => list.map((area) => (area.id === selected.id ? { ...area, correct } : area)))}
              onRemove={() => remove(selected.id)}
            />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

function DraftShape({ draft, shape }: { draft: { start: Fraction; end: Fraction }; shape: Shape }) {
  const { start, end } = draft;
  return (
    <Box
      sx={{
        position: "absolute", pointerEvents: "none", border: "2px dashed", borderColor: "primary.main",
        left: `${Math.min(start.x, end.x) * 100}%`, top: `${Math.min(start.y, end.y) * 100}%`,
        width: `${Math.abs(start.x - end.x) * 100}%`, height: `${Math.abs(start.y - end.y) * 100}%`,
        borderRadius: shape === "ellipse" ? "50%" : 0,
      }}
    />
  );
}
