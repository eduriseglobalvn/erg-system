import { useMemo, useState } from "react";
import { Eye, Link2, RotateCcw, ShieldCheck } from "lucide-react";

import {
  DEFAULT_WATERMARK_CONFIG,
  DISCLOSURE_CATEGORIES,
  getDocumentWatermark,
  PUBLIC_DISCLOSURE_DOCUMENTS,
} from "@/features/lcms/public-disclosure/api/public-disclosure-data";
import { ProtectedPdfViewer } from "@/features/lcms/public-disclosure/components/protected-pdf-viewer";
import type {
  PublicDisclosureDocument,
  WatermarkConfig,
  WatermarkPosition,
} from "@/features/lcms/public-disclosure/types/public-disclosure-types";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

const positionLabels: Record<WatermarkPosition, string> = {
  center: "Giữa trang",
  "top-left": "Trên trái",
  "top-right": "Trên phải",
  "bottom-left": "Dưới trái",
  "bottom-right": "Dưới phải",
};

export function PublicDisclosureAdminWorkspace({ embedded = false }: { embedded?: boolean }) {
  const [selectedDocumentId, setSelectedDocumentId] = useState(PUBLIC_DISCLOSURE_DOCUMENTS[0]?.id ?? "");
  const selectedDocument = useMemo(
    () => PUBLIC_DISCLOSURE_DOCUMENTS.find((document) => document.id === selectedDocumentId) ?? PUBLIC_DISCLOSURE_DOCUMENTS[0],
    [selectedDocumentId],
  );
  const [watermark, setWatermark] = useState<WatermarkConfig>(
    selectedDocument ? getDocumentWatermark(selectedDocument) : DEFAULT_WATERMARK_CONFIG,
  );
  const previewDocument = selectedDocument
    ? { ...selectedDocument, watermark }
    : PUBLIC_DISCLOSURE_DOCUMENTS[0];

  function selectDocument(document: PublicDisclosureDocument) {
    setSelectedDocumentId(document.id);
    setWatermark(getDocumentWatermark(document));
  }

  return (
    <main className="min-h-svh overflow-auto bg-[#f7f8fa] p-4 text-slate-950 md:p-5">
      <section className="mx-auto grid max-w-7xl gap-4">
        {!embedded ? (
          <header className="rounded-[8px] border border-[#e0e4ea] bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">LCMS ERG / Cấu hình</p>
                <h1 className="text-lg font-semibold leading-snug text-slate-950">Công khai pháp lý</h1>
              </div>
              <WatermarkRequiredPill />
            </div>
          </header>
        ) : (
          <div className="flex justify-end">
            <WatermarkRequiredPill />
          </div>
        )}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <DocumentTable selectedDocumentId={selectedDocument?.id} onSelect={selectDocument} />

          <aside className="grid gap-4">
            <WatermarkEditor watermark={watermark} onChange={setWatermark} />
            <PublicationPlacement document={previewDocument} />
          </aside>
        </section>

        <section className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-[8px] border border-[#e0e4ea] bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Preview
            </h2>
            <div className="mt-3 grid gap-2 rounded-md bg-slate-50 p-3 text-sm">
              <InfoLine label="Tài liệu" value={previewDocument.title} />
              <InfoLine label="Danh mục" value={getCategoryTitle(previewDocument.categoryId)} />
              <InfoLine label="Trạng thái" value={getStatusLabel(previewDocument.status)} />
              <InfoLine label="Viewer URL" value={previewDocument.viewerPath} />
            </div>
          </div>
          <ProtectedPdfViewer document={previewDocument} compact />
        </section>
      </section>
    </main>
  );
}

function DocumentTable({
  selectedDocumentId,
  onSelect,
}: {
  selectedDocumentId?: string;
  onSelect: (document: PublicDisclosureDocument) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[8px] border border-[#e0e4ea] bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">Tài liệu đã import</h2>
        <p className="text-xs text-slate-500">Chọn một dòng để xem public placement và watermark.</p>
      </div>
      <div className="hidden grid-cols-[minmax(260px,1fr)_150px_120px_170px] gap-3 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-500 lg:grid">
        <span>Tài liệu</span>
        <span>Danh mục</span>
        <span>Trạng thái</span>
        <span>Vị trí công khai</span>
      </div>
      <div className="divide-y divide-slate-200">
        {PUBLIC_DISCLOSURE_DOCUMENTS.map((document) => (
          <button
            key={document.id}
            type="button"
            onClick={() => onSelect(document)}
            className={cn(
              "grid w-full gap-3 px-4 py-3 text-left transition lg:grid-cols-[minmax(260px,1fr)_150px_120px_170px] lg:items-center",
              selectedDocumentId === document.id ? "bg-[var(--erg-blue-light)]" : "bg-white hover:bg-slate-50",
            )}
          >
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-950">{document.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{document.code} · {document.pageCount} trang</p>
            </div>
            <span className="text-sm font-medium text-slate-700">{getCategoryTitle(document.categoryId)}</span>
            <StatusPill status={document.status} />
            <span className="break-all text-xs text-slate-500">{document.publicPath}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function WatermarkEditor({
  watermark,
  onChange,
}: {
  watermark: WatermarkConfig;
  onChange: (watermark: WatermarkConfig) => void;
}) {
  return (
    <section className="rounded-[8px] border border-[#e0e4ea] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Cấu hình watermark</h2>
          <p className="mt-1 text-xs text-slate-500">Áp dụng cho viewer public và preview admin.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_WATERMARK_CONFIG)}
          className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Đặt lại watermark mặc định"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Text/template
          <input
            value={watermark.text}
            onChange={(event) => onChange({ ...watermark, text: event.target.value })}
            className="h-9 rounded-md border border-[#d1d1d1] px-3 text-sm outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Vị trí
          <AppSelect
            value={watermark.position}
            onChange={(event) => onChange({ ...watermark, position: event.target.value as WatermarkPosition })}
            className="h-9 rounded-md border border-[#d1d1d1] px-3 text-sm outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
          >
            {Object.entries(positionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </AppSelect>
        </label>
        <RangeControl label="Offset X" min={-120} max={120} value={watermark.offsetX} onChange={(offsetX) => onChange({ ...watermark, offsetX })} />
        <RangeControl label="Offset Y" min={-120} max={120} value={watermark.offsetY} onChange={(offsetY) => onChange({ ...watermark, offsetY })} />
        <RangeControl label="Opacity" min={0.05} max={0.35} step={0.01} value={watermark.opacity} onChange={(opacity) => onChange({ ...watermark, opacity })} />
        <RangeControl label="Rotation" min={-45} max={45} value={watermark.rotation} onChange={(rotation) => onChange({ ...watermark, rotation })} />
        <RangeControl label="Scale" min={0.7} max={1.6} step={0.05} value={watermark.scale} onChange={(scale) => onChange({ ...watermark, scale })} />
      </div>
    </section>
  );
}

function PublicationPlacement({ document }: { document: PublicDisclosureDocument }) {
  return (
    <section className="rounded-[8px] border border-[#e0e4ea] bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <Link2 className="h-4 w-4" aria-hidden="true" />
        Vị trí public
      </h2>
      <div className="mt-3 grid gap-2 text-sm">
        <InfoLine label="Category" value={getCategoryTitle(document.categoryId)} />
        <InfoLine label="Section" value={document.section} />
        <InfoLine label="Public URL" value={document.publicPath} />
        <InfoLine label="Viewer URL" value={document.viewerPath} />
      </div>
    </section>
  );
}

function WatermarkRequiredPill() {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2 text-xs font-semibold text-[var(--erg-blue)]">
      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
      Watermark bắt buộc
    </div>
  );
}

function RangeControl({
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span className="flex items-center justify-between">
        {label}
        <span className="text-xs text-slate-500">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-[var(--erg-blue)]"
      />
    </label>
  );
}

function StatusPill({ status }: { status: PublicDisclosureDocument["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-medium",
        status === "published"
          ? "bg-emerald-50 text-emerald-700"
          : status === "review"
            ? "bg-amber-50 text-amber-700"
            : "bg-slate-100 text-slate-600",
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md bg-slate-50 p-2.5">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className="break-words text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function getCategoryTitle(categoryId: PublicDisclosureDocument["categoryId"]) {
  return DISCLOSURE_CATEGORIES.find((category) => category.id === categoryId)?.title ?? "Khác";
}

function getStatusLabel(status: PublicDisclosureDocument["status"]) {
  if (status === "published") return "Đã xuất bản";
  if (status === "review") return "Đang rà soát";
  return "Bản nháp";
}
