import { useCallback, useState } from "react";

import { apiRequest } from "@/lib/api-client";

type NotificationState = "unsupported" | "blocked" | "default" | "enabled" | "unconfigured";

const PUSH_SUBSCRIPTION_ENDPOINT = "/api/lms/push-subscriptions";

export function usePwaNotifications() {
  const [state, setState] = useState<NotificationState>(() => getInitialNotificationState());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enableNotifications = useCallback(async () => {
    if (!isNotificationSupported() || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return "unsupported" as const;
    }

    const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY?.trim();
    if (!publicKey) {
      setState("unconfigured");
      setError("Chua cau hinh VITE_WEB_PUSH_PUBLIC_KEY.");
      return "unconfigured" as const;
    }

    setBusy(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(resolvePermissionState(permission));
        return permission;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(publicKey),
          userVisibleOnly: true,
        }));

      await apiRequest(PUSH_SUBSCRIPTION_ENDPOINT, {
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
        }),
        method: "POST",
        portal: "lms",
      });

      setState("enabled");
      return "granted" as const;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Khong the bat thong bao.";
      setError(message);
      return "failed" as const;
    } finally {
      setBusy(false);
    }
  }, []);

  const disableNotifications = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return false;

    setBusy(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setState(resolvePermissionState(Notification.permission));
        return true;
      }

      await apiRequest(PUSH_SUBSCRIPTION_ENDPOINT, {
        body: JSON.stringify({ endpoint: subscription.endpoint }),
        method: "DELETE",
        portal: "lms",
      });
      await subscription.unsubscribe();
      setState(resolvePermissionState(Notification.permission));
      return true;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Khong the tat thong bao.";
      setError(message);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    busy,
    disableNotifications,
    enableNotifications,
    error,
    state,
  };
}

function getInitialNotificationState(): NotificationState {
  if (!isNotificationSupported()) return "unsupported";
  return resolvePermissionState(Notification.permission);
}

function resolvePermissionState(permission: NotificationPermission): NotificationState {
  if (permission === "granted") return "enabled";
  if (permission === "denied") return "blocked";
  return "default";
}

function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}
