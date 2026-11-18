import { apiRequest } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { isNonEmptyString, isObject, validateResponse } from "@/lib/validate-response";

export type StudentCredentialReset = { studentId: string; username: string; password: string };

const isCredentialReset = (value: unknown): value is StudentCredentialReset =>
  isObject(value) && isNonEmptyString(value.studentId) && isNonEmptyString(value.username) && isNonEmptyString(value.password);

/** Reissues a student's password; the new one comes back in this response only. `portal` is the caller's workspace. */
export async function resetStudentCredential(input: {
  classId: string;
  portal: "lms" | "lcms";
  studentId: string;
}): Promise<StudentCredentialReset> {
  const response = await apiRequest<StudentCredentialReset>(
    API_ENDPOINTS.lms.studentCredentialReset(input.classId, input.studentId),
    { method: "POST", portal: input.portal },
  );
  return validateResponse(response, isCredentialReset, "lms.student.credential-reset");
}
