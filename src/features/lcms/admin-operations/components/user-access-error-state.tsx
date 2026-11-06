import AlertTriangle from "@mui/icons-material/WarningAmber";
import RefreshCw from "@mui/icons-material/Refresh";
import Button from "@mui/material/Button";

export function UserAccessErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-rose-50/70 p-5 text-left shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-rose-200 bg-white text-rose-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-rose-900">Không tải được danh sách thành viên</h3>
          <p className="mt-1 break-words text-xs leading-5 text-rose-700">{message}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={onRetry}
              startIcon={<RefreshCw className="h-3.5 w-3.5" />}
              className="h-8 border-rose-200 bg-white text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              Tải lại
            </Button>
            <span className="text-[11px] font-semibold text-rose-700/80">Kiểm tra API IAM hoặc đăng nhập lại nếu phiên đã hết hạn.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
