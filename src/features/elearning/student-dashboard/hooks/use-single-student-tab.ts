import { useCallback, useEffect, useRef, useState } from "react";

const CHANNEL = "erg:student-tab";

type TabMessage = { accountId: string; tabId: string; type: "claim" };

/**
 * One open tab per student account in a browser: a tab that opens (or takes over) claims the account, and every
 * other tab of that account is replaced at once. Only the tab is locked; signing out would sign out the new tab too,
 * since tabs share one session.
 * shortcut: same-browser only (BroadcastChannel); another device or browser needs a server-side session limit.
 */
export function useSingleStudentTab(accountId: string | null | undefined) {
  const tabId = useRef("");
  const channel = useRef<BroadcastChannel | null>(null);
  const [replaced, setReplaced] = useState(false);

  const claim = useCallback(() => {
    if (!accountId) return;
    setReplaced(false);
    channel.current?.postMessage({ accountId, tabId: tabId.current, type: "claim" } satisfies TabMessage);
  }, [accountId]);

  useEffect(() => {
    if (!accountId || typeof BroadcastChannel === "undefined") return;
    tabId.current ||= Math.random().toString(36).slice(2);
    const current = new BroadcastChannel(CHANNEL);
    channel.current = current;
    current.onmessage = (event: MessageEvent<TabMessage>) => {
      const message = event.data;
      if (message?.type === "claim" && message.accountId === accountId && message.tabId !== tabId.current) setReplaced(true);
    };
    current.postMessage({ accountId, tabId: tabId.current, type: "claim" } satisfies TabMessage);
    return () => {
      current.close();
      channel.current = null;
    };
  }, [accountId]);

  return { claim, replaced };
}
