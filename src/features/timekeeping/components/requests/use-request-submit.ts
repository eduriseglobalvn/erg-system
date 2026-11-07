import { useState } from "react";
import { toast } from "sonner";

import type { RequestCommand, RequestView } from "../../api/timekeeping-types";
import { useSaveRequest } from "../../api/timekeeping-request-query";
import { requestErrorText } from "./request-model";
import { useRequestsNav } from "./use-requests-nav";

/**
 * Shared save flow of the request forms. `run(command, send)` takes `null` when validation failed (errors then show);
 * a sent request opens its detail (G10), a draft returns to the list. Failures stay inline and the form keeps its values.
 */
export function useRequestSubmit(editing?: RequestView) {
  const save = useSaveRequest(editing);
  const nav = useRequestsNav();
  const [attempted, setAttempted] = useState(false);
  const run = async (command: RequestCommand | null, send: boolean) => {
    setAttempted(true);
    if (!command) return;
    try {
      const saved = await save.mutateAsync({ command, send });
      if (send && saved.id) nav.toDetail(saved.id, true);
      else {
        toast.success("Đã lưu nháp");
        nav.toList(true);
      }
    } catch {
      // the failure is in save.error and rendered by the form
    }
  };
  return { attempted, run, pending: save.isPending, error: save.error ? requestErrorText(save.error) : null };
}
