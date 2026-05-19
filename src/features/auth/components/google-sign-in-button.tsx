import { memo, useEffect, useRef, useState } from "react";

import {
  getGoogleClientId,
  loadGoogleIdentityScript,
} from "@/features/auth/api/google-identity";
import { cn } from "@/utils/cn";

type GoogleSignInButtonProps = {
  label: string;
  onCredential: (idToken: string) => void;
  onError: (message: string) => void;
};

export const GoogleSignInButton = memo(function GoogleSignInButton({ label, onCredential, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initGoogle() {
      const clientId = getGoogleClientId();
      if (!clientId) {
        setIsError(true);
        onError("Chưa cấu hình VITE_GOOGLE_CLIENT_ID cho đăng nhập Google.");
        return;
      }

      try {
        await loadGoogleIdentityScript();
      } catch {
        if (!cancelled) {
          setIsError(true);
          onError("Không thể tải Google Identity Services.");
        }
        return;
      }

      if (cancelled) return;

      const google = window.google?.accounts?.id;
      if (!google) {
        setIsError(true);
        onError("Không thể khởi tạo đăng nhập Google.");
        return;
      }

      google.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onCredential(response.credential);
          }
        },
      });

      if (containerRef.current) {
        google.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width: containerRef.current.offsetWidth,
          shape: "pill",
        });
        setIsLoaded(true);
      }
    }

    void initGoogle();

    return () => {
      cancelled = true;
    };
  }, [onCredential, onError]);

  return (
    <div className="relative h-[52px] w-full overflow-hidden transition-all duration-300">
      {/* Nút thật của Google được render ẩn đi nhưng vẫn clickable nếu cần, hoặc ta dùng nó làm nền */}
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 z-10 opacity-0 transition-opacity duration-500",
          isLoaded && !isError ? "hover:opacity-10" : "pointer-events-none"
        )}
      />

      {/* Nút Custom Đẹp mắt của ERG */}
      <div
        className={cn(
          "flex h-full w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]",
          isError && "opacity-50 grayscale"
        )}
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 1.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span className="text-[15px]">{isError ? "Đăng nhập Google lỗi" : label}</span>
        
        {!isLoaded && !isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
             <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          </div>
        )}
      </div>

      {isError ? (
        <div className="mt-2 text-center text-[11px] font-medium text-rose-600">
          Vui lòng thử lại trên Chrome hoặc dùng Email.
        </div>
      ) : null}
    </div>
  );
});
