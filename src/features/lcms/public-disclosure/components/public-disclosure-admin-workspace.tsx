import { useMemo, useState } from "react";
import {
  Eye,
  FileUp,
  Link2,
  MapPinned,
  RotateCcw,
  Settings2,
  ShieldCheck,
} from "lucide-react";

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

const positionLabels: Record<WatermarkPosition, string> = {
  center: "Giữa trang",
  "top-left": "Trên trái",
  "top-right": "Trên phải",
  "bottom-left": "Dưới trái",
  "bottom-right": "Dưới phải",
};

export function PublicDisclosureAdminWorkspace() {
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
    <main className="min-h-svh overflow-auto bg-[#f4f8fd] p-4 text-slate-950 md:p-6">
      <section className="mx-auto grid max-w-7xl gap-5">
        <header className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--erg-blue)]">
                Quản trị công khai pháp lý
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                Import PDF, cấu hình watermark và kiểm soát vị trí hiển thị công khai.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Admin nhìn được trạng thái xuất bản, category/section, public URL và viewer URL của từng tài liệu trước khi đưa ra trang `/cong-khai`.
              </p>
            </div>
            <div className="grid gap-2 rounded-[8px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                Watermark bắt buộc
              </div>
              <p>Không có cấu hình riêng thì viewer tự dùng watermark mặc định.</p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-5">
            <WorkflowPanel />
            <DocumentTable
              selectedDocumentId={selectedDocument?.id}
              onSelect={selectDocument}
            />
          </div>

          <aside className="grid gap-5">
            <WatermarkEditor watermark={watermark} onChange={setWatermark} />
            <PublicationPlacement document={previewDocument} />
          </aside>
        </section>

        <section className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
          <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <Eye className="h-5 w-5" aria-hidden="true" />
              Preview trước khi xuất bản
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Viewer bên cạnh dùng chính cấu hình watermark hiện tại. Admin chỉnh vị trí, độ mờ, xoay và tỷ lệ trước khi publish.
            </p>
            <div className="mt-4 grid gap-3 rounded-[8px] bg-slate-50 p-4 text-sm">
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

function WorkflowPanel() {
  const steps = [
    { icon: FileUp, title: "Import PDF", detail: "Chọn file, đọc tên, số trang và kích thước." },
    { icon: Settings2, title: "Metadata", detail: "Gán danh mục, section, mã tài liệu và mô tả." },
    { icon: ShieldCheck, title: "Watermark", detail: "Áp dụng mặc định hoặc chỉnh cấu hình riêng." },
    { icon: MapPinned, title: "Publish", detail: "Hiển thị vị trí public URL và viewer URL." },
  ];

  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Luồng quản lý</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <article key={step.title} className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-white text-[var(--erg-blue)] shadow-sm">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                Bước {index + 1}
              </div>
              <h3 className="mt-3 font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">{step.detail}</p>
            </article>
          );
        })}
      </div>
    </section>
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
    <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-950">Tài liệu đã import</h2>
        <p className="mt-1 text-sm text-slate-500">Chọn một dòng để xem cấu hình public placement và watermark.</p>
      </div>
      <div className="hidden grid-cols-[minmax(260px,1fr)_150px_120px_170px] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 lg:grid">
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
              "grid w-full gap-3 px-4 py-4 text-left lg:grid-cols-[minmax(260px,1fr)_150px_120px_170px] lg:items-center",
              selectedDocumentId === document.id ? "bg-blue-50" : "bg-white hover:bg-slate-50",
            )}
          >
            <div>
              <h3 className="font-semibold text-slate-950">{document.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{document.code} · {document.pageCount} trang</p>
            </div>
            <span className="text-sm font-medium text-slate-700">{getCategoryTitle(document.categoryId)}</span>
            <StatusPill status={document.status} />
            <span className="text-sm text-slate-500">{document.publicPath}</span>
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
    <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Cấu hình watermark</h2>
          <p className="mt-1 text-sm text-slate-500">Áp dụng cho viewer public và preview admin.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_WATERMARK_CONFIG)}
          className="grid h-10 w-10 place-items-center rounded-[8px] border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Đặt lại watermark mặc định"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Text/template
          <input
            value={watermark.text}
            onChange={(event) => onChange({ ...watermark, text: event.target.value })}
            className="h-11 rounded-[8px] border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Vị trí
          <select
            value={watermark.position}
            onChange={(event) => onChange({ ...watermark, position: event.target.value as WatermarkPosition })}
            className="h-11 rounded-[8px] border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          >
            {Object.entries(positionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
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
    <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
        <Link2 className="h-5 w-5" aria-hidden="true" />
        Vị trí public
      </h2>
      <div className="mt-4 grid gap-3 text-sm">
        <InfoLine label="Category" value={getCategoryTitle(document.categoryId)} />
        <InfoLine label="Section" value={document.section} />
        <InfoLine label="Public URL" value={document.publicPath} />
        <InfoLine label="Viewer URL" value={document.viewerPath} />
      </div>
    </section>
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
        "inline-flex w-fit rounded-[8px] px-2.5 py-1 text-xs font-semibold",
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
    <div className="grid gap-1 rounded-[8px] bg-slate-50 p-3">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <span className="break-words font-semibold text-slate-900">{value}</span>
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
