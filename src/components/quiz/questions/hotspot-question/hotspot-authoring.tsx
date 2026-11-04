import { Circle, Eye, EyeOff, Plus, Square, Trash2, MousePointer2 } from "lucide-react";
import type { RefObject } from "react";

import type { HotspotArea, Question } from "@/lib/types";

import { HotspotEditableArea } from "./hotspot-editable-area";

export interface HotspotAuthoringProps {
  question: Question;
  areas: HotspotArea[];
  activeArea: HotspotArea | null;
  imageRef: RefObject<HTMLDivElement | null>;
  addArea: (shape?: unknown) => void;
  updateArea: (areaId: string, patch: Partial<HotspotArea>) => void;
  removeArea: (areaId: string) => void;
  setAreaCount: (count: number) => void;
  setActiveAreaId: (id: string | null) => void;
  onPickArea: (clientX: number, clientY: number, target: HTMLDivElement | null) => void;
}

export function HotspotAuthoring({
  question,
  areas,
  activeArea,
  imageRef,
  addArea,
  updateArea,
  removeArea,
  setAreaCount,
  setActiveAreaId,
  onPickArea,
}: HotspotAuthoringProps) {
  if (!question.hotspotImage) return null;
  return (
    <div className="quiz-answer-region-wide hotspot-authoring-clean">
      <div className="hotspot-authoring-toolbar is-map-tools">
        <strong>{activeArea ? `Vùng ${Math.max(1, areas.findIndex((area) => area.id === activeArea.id) + 1)}` : "Vùng chọn"}</strong>
        <button
          type="button"
          className={activeArea?.shape !== "ellipse" && activeArea?.shape !== "polygon" ? "is-active is-icon" : "is-icon"}
          onClick={() => activeArea ? updateArea(activeArea.id, { shape: "rect" }) : addArea("rect")}
          aria-label="Hình chữ nhật"
          title="Hình chữ nhật"
        >
          <Square />
        </button>
        <button
          type="button"
          className={activeArea?.shape === "ellipse" ? "is-active is-icon" : "is-icon"}
          onClick={() => activeArea ? updateArea(activeArea.id, { shape: "ellipse" }) : addArea("ellipse")}
          aria-label="Hình tròn"
          title="Hình tròn"
        >
          <Circle />
        </button>
        <button type="button" className="is-icon" disabled aria-label="Vẽ tự do" title="Vẽ tự do">
          <MousePointer2 />
        </button>
        <span className="hotspot-authoring-divider" />
        <button
          type="button"
          className={activeArea?.visible !== false ? "is-active is-icon" : "is-icon"}
          onClick={() => activeArea ? updateArea(activeArea.id, { visible: activeArea.visible === false }) : addArea()}
          aria-label={activeArea?.visible === false ? "Ẩn vùng" : "Hiện vùng"}
          title={activeArea?.visible === false ? "Ẩn vùng" : "Hiện vùng"}
        >
          {activeArea?.visible === false ? <EyeOff /> : <Eye />}
        </button>
        <label className="hotspot-authoring-count">
          <span>Số vùng</span>
          <input
            type="number"
            min={1}
            max={12}
            value={Math.max(areas.length, 1)}
            onChange={(event) => setAreaCount(Number(event.target.value))}
          />
        </label>
        <button type="button" onClick={() => addArea()}>
          <Plus className="h-3.5 w-3.5" />
          Thêm vùng
        </button>
        {activeArea && areas.length > 1 ? (
          <button type="button" className="is-danger is-icon" onClick={() => removeArea(activeArea.id)} aria-label="Xóa vùng" title="Xóa vùng">
            <Trash2 />
          </button>
        ) : null}
      </div>
      <div className="hotspot-authoring-toolbar is-legacy">
        <strong>{activeArea ? `Vùng đúng ${Math.max(1, areas.findIndex((area) => area.id === activeArea.id) + 1)}` : "Vùng đúng"}</strong>
        <button
          type="button"
          className={activeArea?.shape !== "ellipse" ? "is-active" : ""}
          onClick={() => activeArea ? updateArea(activeArea.id, { shape: "rect" }) : addArea()}
        >
          Hình vuông
        </button>
        <button
          type="button"
          className={activeArea?.shape === "ellipse" ? "is-active" : ""}
          onClick={() => activeArea ? updateArea(activeArea.id, { shape: "ellipse" }) : addArea()}
        >
          Hình tròn
        </button>
        <button
          type="button"
          className={activeArea?.visible !== false ? "is-active" : ""}
          onClick={() => activeArea ? updateArea(activeArea.id, { visible: activeArea.visible === false }) : addArea()}
        >
          {activeArea?.visible === false ? "Ẩn vùng" : "Hiện vùng"}
        </button>
        <button type="button" onClick={addArea}>Thêm vùng</button>
        {activeArea && areas.length > 1 ? (
          <button type="button" className="is-danger" onClick={() => removeArea(activeArea.id)}>
            Xóa
          </button>
        ) : null}
      </div>
      <div
        ref={imageRef}
        className="hotspot-authoring-image"
        style={{
          borderColor: "var(--quiz-canvas-border)",
        }}
        onClick={(event) => {
          onPickArea(event.clientX, event.clientY, imageRef.current);
        }}
      >
        <img
          src={question.hotspotImage.url}
          alt={question.title}
          className="block h-full w-full object-contain"
        />
        {areas.map((area, index) => (
          <HotspotEditableArea
            key={area.id}
            area={area}
            active={activeArea?.id === area.id}
            index={index}
            stageRef={imageRef}
            onSelect={() => setActiveAreaId(area.id)}
            onChange={(patch) => updateArea(area.id, patch)}
          />
        ))}
      </div>
    </div>
  );
}
