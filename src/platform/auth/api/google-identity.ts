type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptMoment = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
};

type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
      auto_select?: boolean;
      cancel_on_tap_outside?: boolean;
    }) => void;
    renderButton: (
      parent: HTMLElement,
      options: {
        locale?: string;
        shape?: "rectangular" | "pill" | "circle" | "square";
        size?: "large" | "medium" | "small";
        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
        theme?: "outline" | "filled_blue" | "filled_black";
        width?: number;
      },
    ) => void;
    prompt: (callback?: (moment: GooglePromptMoment) => void) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";
let scriptPromise: Promise<void> | null = null;

export function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
}

export async function requestGoogleIdToken() {
  const clientId = getGoogleClientId();

  if (!clientId) {
    throw new Error("Chưa cấu hình VITE_GOOGLE_CLIENT_ID cho đăng nhập Google.");
  }

  await loadGoogleIdentityScript();

  const google = window.google?.accounts?.id;
  if (!google) {
    throw new Error("Không thể tải Google Identity Services. Vui lòng thử lại.");
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("Không nhận được phản hồi từ Google. Vui lòng thử lại."));
    }, 60_000);

    google.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: (response) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);

        if (!response.credential) {
          reject(new Error("Google không trả về mã xác thực hợp lệ."));
          return;
        }

        resolve(response.credential);
      },
    });

    google.prompt((moment) => {
      if (settled) return;
      if (moment.isNotDisplayed() || moment.isSkippedMoment()) {
        settled = true;
        window.clearTimeout(timeout);
        reject(new Error(`Không thể mở đăng nhập Google (${moment.getNotDisplayedReason() || moment.getSkippedReason()}).`));
      }
    });
  });
}

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Không thể tải Google Identity Services.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không thể tải Google Identity Services."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}
