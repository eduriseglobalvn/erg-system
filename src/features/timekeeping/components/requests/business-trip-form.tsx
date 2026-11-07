import type { RequestView } from "../../api/timekeeping-types";
import { RangeRequestForm } from "./range-request-form";

/** Công tác. */
export function BusinessTripForm({ initial }: { initial?: RequestView }) {
  return <RangeRequestForm initial={initial} type="BUSINESS" />;
}
