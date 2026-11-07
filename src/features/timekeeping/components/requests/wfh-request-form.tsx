import type { RequestView } from "../../api/timekeeping-types";
import { RangeRequestForm } from "./range-request-form";

/** Làm việc tại nhà. */
export function WfhRequestForm({ initial }: { initial?: RequestView }) {
  return <RangeRequestForm initial={initial} type="WFH" />;
}
