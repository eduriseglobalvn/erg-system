import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  QUIZ_ACTIVE_ATTRIBUTE,
  pushToastDuration,
  readPushMessage,
  type PushToastMessage,
} from "@/features/notifications/push/push-floating-model";
import { AUTH_ACCOUNT_CHANGED_EVENT, getAuthScope } from "@/platform/auth/api/auth-storage";

const TOAST_KIND = { URGENT: toast.error, IMPORTANT: toast.warning, INFO: toast.info } as const;

/**
 * Floating in-app card for each Web Push the service worker forwards while ERG is open (plan §10).
 * Nothing arrives unless push is enabled server-side, so with the flag off this renders nothing.
 */
export function PushFloatingHost() {
  const navigate = useNavigate();
  const openIdsRef = useRef<Array<string | number>>([]);

  useEffect(() => {
    const serviceWorker = typeof navigator === "undefined" ? undefined : navigator.serviceWorker;
    if (!serviceWorker) return undefined;
    const root = document.documentElement;
    const queued: PushToastMessage[] = [];

    const forget = (id: string | number) => {
      openIdsRef.current = openIdsRef.current.filter((openId) => openId !== id);
    };
    const show = (message: PushToastMessage) => {
      const id = TOAST_KIND[message.priority](message.title, {
        action: { label: "Mở", onClick: () => void navigate({ href: message.href }) },
        closeButton: true,
        description: message.body,
        duration: pushToastDuration(message.priority),
        id: message.id,
        onAutoClose: (shown) => forget(shown.id),
        onDismiss: (shown) => forget(shown.id),
      });
      openIdsRef.current = [...openIdsRef.current.filter((openId) => openId !== id), id];
    };
    const handleMessage = (event: MessageEvent) => {
      const message = readPushMessage(event.data, window.location.origin);
      if (!message) return;
      // A learner in a quiz is not interrupted; the cards come once the quiz closes.
      if (root.hasAttribute(QUIZ_ACTIVE_ATTRIBUTE)) queued.push(message);
      else show(message);
    };
    const observer = new MutationObserver(() => {
      if (root.hasAttribute(QUIZ_ACTIVE_ATTRIBUTE)) return;
      queued.splice(0).forEach(show);
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      const newest = openIdsRef.current.at(-1);
      if (event.key !== "Escape" || newest === undefined) return;
      toast.dismiss(newest);
      forget(newest);
    };

    // Logout: this browser stops receiving pushes; the server row expires on the next send (410).
    const handleAccountChanged = () => {
      if (getAuthScope().session) return;
      void serviceWorker
        .getRegistration()
        .then((registration) => registration?.pushManager?.getSubscription())
        .then((subscription) => subscription?.unsubscribe())
        .catch(() => undefined);
    };

    serviceWorker.addEventListener("message", handleMessage);
    observer.observe(root, { attributeFilter: [QUIZ_ACTIVE_ATTRIBUTE], attributes: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAccountChanged);
    return () => {
      serviceWorker.removeEventListener("message", handleMessage);
      observer.disconnect();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAccountChanged);
    };
  }, [navigate]);

  return null;
}
