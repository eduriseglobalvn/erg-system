import Box from "@mui/material/Box";
import { useSearch } from "@tanstack/react-router";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { useRequest } from "../../api/timekeeping-request-query";
import type { RequestView } from "../../api/timekeeping-types";
import { BusinessTripForm } from "./business-trip-form";
import { ExplanationForm } from "./explanation-form";
import { LeaveRequestForm } from "./leave-request-form";
import { MyRequestsPage } from "./my-requests-page";
import { FORM_TYPE, parseRequestsSearch, type RequestFormType } from "./request-model";
import { RequestDetailPage } from "./request-detail-page";
import { RequestTypePicker } from "./request-type-picker";
import { WfhRequestForm } from "./wfh-request-form";
import { useRequestsNav } from "./use-requests-nav";

function RequestForm({ type, date, initial }: { type: RequestFormType; date?: string; initial?: RequestView }) {
  switch (type) {
    case "leave": return <LeaveRequestForm initial={initial} />;
    case "explanation": return <ExplanationForm date={date} initial={initial} />;
    case "wfh": return <WfhRequestForm initial={initial} />;
    case "business": return <BusinessTripForm initial={initial} />;
  }
}

/** The form of an existing request, opened from G10 "Sửa": waits for the request, then prefills. */
function EditRequest({ id }: { id: string }) {
  const nav = useRequestsNav();
  const { data, isError, refetch } = useRequest(id);
  if (isError) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}>
        <ErgErrorState
          action={<><ErgButton onClick={() => void refetch()} variant="outlined">Tải lại</ErgButton><ErgButton onClick={() => nav.toList()} variant="text">Về danh sách</ErgButton></>}
          description="Không tải được đơn cần sửa."
          title="Có lỗi xảy ra"
        />
      </Box>
    );
  }
  if (!data?.type) return <Box sx={{ maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 2 }}><ErgSkeleton height={320} /></Box>;
  // key: a different request must not inherit the form state of the previous one
  return <RequestForm initial={data} key={data.id} type={FORM_TYPE[data.type]} />;
}

/** G06–G10 on /timekeeping/requests: the view is chosen by the search params (`?new=`, `?edit=`, `?id=`, `?date=`). */
export function RequestsScreen() {
  const view = parseRequestsSearch(useSearch({ strict: false }) as Record<string, unknown>);
  switch (view.view) {
    case "picker": return <RequestTypePicker />;
    case "form": return <RequestForm date={view.date} key={`${view.type}-${view.date ?? ""}`} type={view.type} />;
    case "edit": return <EditRequest id={view.id} />;
    case "detail": return <RequestDetailPage id={view.id} key={view.id} />;
    default: return <MyRequestsPage />;
  }
}
