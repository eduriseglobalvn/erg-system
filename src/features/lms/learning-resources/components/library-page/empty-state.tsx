import { Search } from "lucide-react";

export function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[#cbd7e6] bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--erg-blue-light)] text-[var(--erg-blue)]">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">Không tìm thấy tài liệu phù hợp</h3>
      <p className="mt-2 text-[14px] font-semibold text-slate-600">Hãy đổi bộ lọc lớp, môn, nhóm học liệu hoặc từ khóa tìm kiếm.</p>
    </div>
  );
}
