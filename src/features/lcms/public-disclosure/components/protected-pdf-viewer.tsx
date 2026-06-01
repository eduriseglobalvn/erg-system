import { useEffect, useMemo, useRef } from "react";
import { AlertTriangle, FileText, ShieldCheck } from "lucide-react";

import {
  getDocumentWatermark,
} from "@/features/lcms/public-disclosure/api/public-disclosure-data";
import type {
  PublicDisclosureDocument,
  WatermarkConfig,
} from "@/features/lcms/public-disclosure/types/public-disclosure-types";
import { cn } from "@/lib/utils";

const BLOCKED_KEYS = new Set(["s", "p", "c"]);

type ProtectedPdfViewerProps = {
  document: PublicDisclosureDocument;
  className?: string;
  compact?: boolean;
};

export function ProtectedPdfViewer({
  document,
  className,
  compact = false,
}: ProtectedPdfViewerProps) {
  const viewerRef = useRef<HTMLElement | null>(null);
  const watermark = useMemo(() => getDocumentWatermark(document), [document]);

  useEffect(() => {
    function preventContextMenu(event: MouseEvent) {
      event.preventDefault();
    }

    function preventProtectedShortcuts(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const blockedCombo =
        (event.ctrlKey || event.metaKey) && BLOCKED_KEYS.has(key);
      const blockedPrintScreen = key === "printscreen";

      if (blockedCombo || blockedPrintScreen) {
        event.preventDefault();
      }
    }

    const viewerElement = viewerRef.current;
    viewerElement?.addEventListener("contextmenu", preventContextMenu);
    window.addEventListener("keydown", preventProtectedShortcuts);

    return () => {
      viewerElement?.removeEventListener("contextmenu", preventContextMenu);
      window.removeEventListener("keydown", preventProtectedShortcuts);
    };
  }, []);

  return (
    <section
      ref={viewerRef}
      className={cn(
        "min-w-0 select-none overflow-hidden rounded-[8px] border border-slate-200 bg-slate-950 shadow-[0_28px_70px_-34px_rgba(15,23,42,0.65)]",
        className,
      )}
      aria-label={`Viewer bảo vệ cho ${document.title}`}
    >
      <div className="flex flex-col gap-3 border-b border-white/10 bg-slate-900 px-4 py-3 text-white md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-white/10">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{document.title}</h2>
            <p className="mt-1 text-xs text-slate-300">
              {document.pageCount} trang · {document.fileSize} · Mã {document.code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-[8px] bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Chỉ xem trong trang
        </div>
      </div>

      <div className="grid gap-4 bg-slate-100 p-4">
        {!compact ? (
          <div className="flex items-start gap-2 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Tài liệu không có nút tải trực tiếp. Lớp bảo vệ trình duyệt giúp giảm rủi ro sao chép phổ biến, không thay thế DRM tuyệt đối ở cấp thiết bị.
          </div>
        ) : null}
        {Array.from({ length: compact ? 1 : Math.min(document.pageCount, 3) }).map((_, index) => (
          <PdfPageMock
            key={`${document.id}-${index}`}
            document={document}
            pageNumber={index + 1}
            watermark={watermark}
          />
        ))}
      </div>
    </section>
  );
}

function PdfPageMock({
  document,
  pageNumber,
  watermark,
}: {
  document: PublicDisclosureDocument;
  pageNumber: number;
  watermark: WatermarkConfig;
}) {
  const positionClass =
    watermark.position === "top-left"
      ? "items-start justify-start"
      : watermark.position === "top-right"
        ? "items-start justify-end"
        : watermark.position === "bottom-left"
          ? "items-end justify-start"
          : watermark.position === "bottom-right"
            ? "items-end justify-end"
            : "items-center justify-center";

  return (
    <article className="relative mx-auto aspect-[1/1.414] w-full max-w-[720px] overflow-hidden rounded-[6px] bg-white p-8 text-slate-950 shadow-sm">
      <div
        className={cn("pointer-events-none absolute inset-0 z-10 flex p-8", positionClass)}
        aria-hidden="true"
      >
        <span
          className="whitespace-nowrap text-center text-3xl font-bold uppercase tracking-[0.2em] text-slate-900"
          style={{
            opacity: watermark.opacity,
            transform: `translate(${watermark.offsetX}px, ${watermark.offsetY}px) rotate(${watermark.rotation}deg) scale(${watermark.scale})`,
          }}
        >
          {watermark.text}
        </span>
      </div>
      <div className="relative z-0 flex h-full flex-col">
        <header className="border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--erg-blue)]">
            ERG Education
          </p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight">
            {document.title}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {document.section} · {document.issuedBy}
          </p>
        </header>
        <div className="grid flex-1 content-start gap-4 py-6 text-sm leading-7 text-slate-700">
          <p>
            Tài liệu công khai được hiển thị ở chế độ xem bảo vệ để phục vụ phụ huynh,
            học viên và cơ quan quản lý tra cứu thông tin minh bạch.
          </p>
          <p>
            Nội dung chính: {document.description}
          </p>
          <div className="grid gap-2 rounded-[8px] border border-slate-200 bg-slate-50 p-4">
            <InfoLine label="Mã tài liệu" value={document.code} />
            <InfoLine label="Ngày ban hành" value={document.issuedAt} />
            <InfoLine label="Cập nhật" value={document.updatedAt} />
            <InfoLine label="Trạng thái" value={document.status === "published" ? "Đã công khai" : document.status === "review" ? "Đang rà soát" : "Bản nháp"} />
          </div>
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <span>Trang {pageNumber}/{document.pageCount}</span>
          <span className="break-all text-right">Viewer URL: {document.viewerPath}</span>
        </footer>
      </div>
    </article>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}
