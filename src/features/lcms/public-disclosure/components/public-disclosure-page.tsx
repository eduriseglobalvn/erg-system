import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  FileSearch,
  FileText,
  Landmark,
  Search,
} from "lucide-react";
import { useParams } from "@/routes/router-compat";

import {
  DISCLOSURE_CATEGORIES,
  getDisclosureDocument,
  PUBLIC_DISCLOSURE_DOCUMENTS,
} from "@/features/lcms/public-disclosure/api/public-disclosure-data";
import { ProtectedPdfViewer } from "@/features/lcms/public-disclosure/components/protected-pdf-viewer";
import type {
  DisclosureCategoryId,
  PublicDisclosureDocument,
} from "@/features/lcms/public-disclosure/types/public-disclosure-types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

export function PublicDisclosurePage() {
  const { documentId } = useParams();
  const queryParams = new URLSearchParams(window.location.search);
  const initialDocument = getDisclosureDocument(documentId ?? queryParams.get("document"));
  const [activeCategory, setActiveCategory] = useState<DisclosureCategoryId | "all">("all");
  const [activeDocumentId, setActiveDocumentId] = useState(initialDocument.id);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const activeDocument = getDisclosureDocument(activeDocumentId);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();

    return PUBLIC_DISCLOSURE_DOCUMENTS.filter((document) => {
      const matchesCategory =
        activeCategory === "all" || document.categoryId === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        [document.title, document.code, document.description, ...document.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, debouncedSearch]);

  return (
    <main className="min-h-svh overflow-x-hidden bg-[#f7f8fa] text-slate-950">
      <section className="border-b border-[#e0e4ea] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[8px] bg-[var(--erg-blue)] text-white">
                <Landmark className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">ERG Education</p>
                <h1 className="text-lg font-semibold text-slate-950">
                  Công khai pháp lý
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5">PDF chỉ xem</span>
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5">Có watermark</span>
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5">{PUBLIC_DISCLOSURE_DOCUMENTS.length} tài liệu</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 lg:flex-row lg:items-center lg:justify-between">
            <nav aria-label="Breadcrumb">
              Trang chủ / Công khai / <span className="font-semibold text-slate-900">{activeDocument.section}</span>
            </nav>
            <p>Cập nhật gần nhất: {activeDocument.updatedAt}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl min-w-0 gap-4 px-4 py-5 md:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="min-w-0 space-y-3">
          <div className="w-full max-w-[calc(100vw-32px)] min-w-0 rounded-[8px] border border-[#e0e4ea] bg-white p-3 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Danh mục
            </h2>
            <div className="mt-3 grid gap-1">
              <CategoryButton
                active={activeCategory === "all"}
                count={PUBLIC_DISCLOSURE_DOCUMENTS.length}
                label="Tất cả tài liệu"
                onClick={() => setActiveCategory("all")}
              />
              {DISCLOSURE_CATEGORIES.map((category) => (
                <CategoryButton
                  key={category.id}
                  active={activeCategory === category.id}
                  count={PUBLIC_DISCLOSURE_DOCUMENTS.filter((document) => document.categoryId === category.id).length}
                  label={category.title}
                  onClick={() => setActiveCategory(category.id)}
                />
              ))}
            </div>
          </div>

          <div className="w-full max-w-[calc(100vw-32px)] min-w-0 rounded-[8px] border border-[#e0e4ea] bg-white p-3 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">Tra cứu nhanh</h2>
            <label className="mt-3 flex h-9 items-center gap-2 rounded-md border border-[#d7e0ec] bg-white px-3 text-sm text-slate-500 focus-within:border-[var(--erg-blue)] focus-within:ring-2 focus-within:ring-[var(--erg-blue-ring)]">
              <Search className="h-4 w-4" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Tên tài liệu, mã, tag..."
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DISCLOSURE_CATEGORIES.map((category) => (
                <div key={category.id} className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-sm font-semibold text-slate-950">
                    {PUBLIC_DISCLOSURE_DOCUMENTS.filter((document) => document.categoryId === category.id).length}
                  </p>
                  <p className="mt-1 text-xs leading-4 text-slate-500">{category.title}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="grid min-w-0 gap-4">
          <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
            <div className="max-w-[calc(100vw-32px)] min-w-0 overflow-hidden rounded-[8px] border border-[#e0e4ea] bg-white shadow-sm lg:max-w-none">
              <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <FileSearch className="h-5 w-5" aria-hidden="true" />
                  Danh sách tài liệu
                </h2>
                <p className="text-xs text-slate-500">
                  {filteredDocuments.length} kết quả phù hợp
                </p>
              </div>
              <div className="hidden grid-cols-[minmax(220px,1fr)_112px_96px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-500 md:grid">
                <span>Tài liệu</span>
                <span>Cập nhật</span>
                <span className="text-right">Thao tác</span>
              </div>
              <div className="divide-y divide-slate-200">
                {filteredDocuments.map((document) => (
                  <DocumentRow
                    key={document.id}
                    active={document.id === activeDocument.id}
                    document={document}
                    onSelect={() => setActiveDocumentId(document.id)}
                  />
                ))}
              </div>
            </div>

            <ProtectedPdfViewer document={activeDocument} />
          </section>
        </div>
      </section>
    </main>
  );
}

function CategoryButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full min-w-0 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition",
        active ? "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className={cn("shrink-0 text-xs", active ? "text-[var(--erg-blue)]" : "text-slate-400")}>{count}</span>
    </button>
  );
}

function DocumentRow({
  active,
  document,
  onSelect,
}: {
  active: boolean;
  document: PublicDisclosureDocument;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full gap-3 px-4 py-3 text-left transition md:grid-cols-[minmax(220px,1fr)_112px_96px] md:items-center",
        active ? "bg-[var(--erg-blue-light)]" : "bg-white hover:bg-slate-50",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-5 text-slate-950">{document.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{document.description}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">
              {document.code} · {document.pageCount} trang
            </p>
          </div>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-500 md:justify-self-start">{document.updatedAt}</span>
      <span className="inline-flex w-fit items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 md:justify-self-end">
        Xem
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </button>
  );
}
