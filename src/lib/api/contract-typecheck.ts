import type { ApiResponseData, ContractPath } from "@/lib/api/contract-types";

const usersPath = "/api/v1/admin/users" satisfies ContractPath;
type UsersResponse = ApiResponseData<typeof usersPath, "get">;
const response: UsersResponse | undefined = undefined;
void response;

// @ts-expect-error endpoint không có trong OpenAPI
const invalidPath = "/api/v1/not-real" satisfies ContractPath;
void invalidPath;
