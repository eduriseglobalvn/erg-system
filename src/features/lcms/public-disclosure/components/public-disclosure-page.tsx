import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  FileSearch,
  FileText,
  Landmark,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useParams } from "react-router-dom";

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
import { cn } from "@/lib/utils";

export function PublicDisclosurePage() {
  const { documentId } = useParams();
  const queryParams = new URLSearchParams(window.location.search);
  const initialDocument = getDisclosureDocument(documentId ?? queryParams.get("document"));
  const [activeCategory, setActiveCategory] = useState<DisclosureCategoryId | "all">("all");
  const [activeDocumentId, setActiveDocumentId] = useState(initialDocument.id);
  const [search, setSearch] = useState("");
  const activeDocument = getDisclosureDocument(activeDocumentId);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

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
  }, [activeCategory, search]);

  return (
    <main className="min-h-svh overflow-x-hidden bg-[#f5f7fb] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-[var(--erg-blue)] text-white">
                <Landmark className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">ERG Education</p>
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 md:text-3xl">
                  Công khai pháp lý
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-medium text-slate-600">
              <span className="rounded-[8px] border border-slate-200 px-3 py-2">Thông tin minh bạch</span>
              <span className="rounded-[8px] border border-slate-200 px-3 py-2">PDF chỉ xem</span>
              <span className="rounded-[8px] border border-slate-200 px-3 py-2">Có watermark</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
            <nav aria-label="Breadcrumb">
              Trang chủ / Công khai / <span className="font-semibold text-slate-900">{activeDocument.section}</span>
            </nav>
            <p>Cập nhật gần nhất: {activeDocument.updatedAt}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl min-w-0 gap-5 px-4 py-6 md:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
        <aside className="min-w-0 space-y-4">
          <div className="w-full max-w-[calc(100vw-32px)] min-w-0 rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Danh mục
            </h2>
            <div className="mt-4 grid gap-2">
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

          <div className="w-full max-w-[calc(100vw-32px)] min-w-0 rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">Tra cứu nhanh</h2>
            <label className="mt-3 flex h-11 items-center gap-2 rounded-[8px] border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              <Search className="h-4 w-4" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Tên tài liệu, mã, tag..."
              />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {DISCLOSURE_CATEGORIES.map((category) => (
                <div key={category.id} className="rounded-[8px] bg-slate-50 p-3">
                  <p className="text-xl font-semibold text-slate-950">
                    {PUBLIC_DISCLOSURE_DOCUMENTS.filter((document) => document.categoryId === category.id).length}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{category.title}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="grid min-w-0 gap-5">
          <section className="max-w-[calc(100vw-32px)] rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm lg:max-w-none">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--erg-blue)]">
                  Cổng thông tin công khai
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 md:text-4xl">
                  Tài liệu pháp lý được tổ chức theo danh mục và xem trực tiếp trong viewer bảo vệ.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  ERG công khai hồ sơ theo nhóm nội dung để phụ huynh và học viên tìm đúng giấy tờ cần đọc. Giao diện không cung cấp đường tải PDF trực tiếp.
                </p>
              </div>
              <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  Lớp bảo vệ viewer
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Chặn context menu, phím tắt lưu/in/sao chép phổ biến và luôn hiển thị watermark theo cấu hình tài liệu.
                </p>
              </div>
            </div>
          </section>

          <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
            <div className="max-w-[calc(100vw-32px)] min-w-0 rounded-[8px] border border-slate-200 bg-white shadow-sm lg:max-w-none">
              <div className="border-b border-slate-200 p-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
                  <FileSearch className="h-5 w-5" aria-hidden="true" />
                  Danh sách tài liệu
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredDocuments.length} kết quả phù hợp
                </p>
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
        "flex w-full min-w-0 items-center justify-between gap-3 rounded-[8px] px-3 py-2.5 text-left text-sm font-semibold transition",
        active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className={cn("shrink-0 text-xs", active ? "text-slate-300" : "text-slate-400")}>{count}</span>
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
        "grid w-full gap-3 px-4 py-4 text-left transition md:grid-cols-[minmax(0,1fr)_120px] md:items-center",
        active ? "bg-blue-50" : "bg-white hover:bg-slate-50",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-slate-100 text-slate-600">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold leading-6 text-slate-950">{document.title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{document.description}</p>
            <p className="mt-2 text-xs font-medium text-slate-400">
              {document.code} · {document.pageCount} trang · {document.updatedAt}
            </p>
          </div>
        </div>
      </div>
      <span className="inline-flex w-fit items-center gap-1 rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 md:justify-self-end">
        Xem
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </button>
  );
}
