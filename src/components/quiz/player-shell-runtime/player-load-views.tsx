import Skeleton from "@mui/material/Skeleton";

export function PlayerLoadingView() {
  return (
      <div className="grid gap-5 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <Skeleton variant="rounded" className="h-8 w-48" />
          <Skeleton variant="rounded" className="h-10 w-28 rounded-lg" />
        </div>
        <Skeleton variant="rounded" className="h-72 w-full rounded-lg" />
        <div className="grid gap-3 md:grid-cols-4">
          <Skeleton variant="rounded" className="h-12 rounded-lg" />
          <Skeleton variant="rounded" className="h-12 rounded-lg" />
          <Skeleton variant="rounded" className="h-12 rounded-lg" />
          <Skeleton variant="rounded" className="h-12 rounded-lg" />
        </div>
      </div>
  );
}

export function PlayerErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid gap-4 rounded-lg border border-red-100 bg-white p-8 text-red-600 shadow-sm">
      <p>{message}</p>
      <button
        type="button"
        className="w-fit rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        onClick={onRetry}
      >
        Thử lại
      </button>
    </div>
  );
}
