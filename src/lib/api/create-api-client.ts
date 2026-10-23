import {
  apiRequest,
  type ApiRequestOptions,
} from "@/lib/api-client";
import type { ContractRequestPath } from "@/lib/api/contract-types";
import type { ApiOperationOptions, ApiResponseData, ContractMethod, ContractPath } from "@/lib/api/contract-types";

type ClientConfig = Pick<ApiRequestOptions, "portal" | "auth">;

export function createApiClient(config: ClientConfig) {
  const stableConfig = { ...config };

  return {
    operation<P extends ContractPath, M extends ContractMethod<P>>(
      path: P,
      method: M,
      options: ApiOperationOptions<P, M> = {},
    ): Promise<ApiResponseData<P, M>> {
      const { body, query, ...requestOptions } = options;
      const requestPath = appendQuery(path, query);
      return apiRequest<ApiResponseData<P, M>>(requestPath, {
        ...requestOptions,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        ...(method === "get" ? {} : { method: String(method).toUpperCase() }),
        portal: stableConfig.portal,
        auth: stableConfig.auth,
      });
    },
    request<T = unknown>(
      path: ContractRequestPath,
      init: Omit<ApiRequestOptions, "portal" | "auth"> & { method?: string } = {},
    ): Promise<T> {
      return apiRequest<T>(path as ContractRequestPath, {
        ...init,
        portal: stableConfig.portal,
        auth: stableConfig.auth,
      });
    },
  };
}

function appendQuery(path: ContractPath, query: unknown): ContractRequestPath {
  if (!query || typeof query !== "object") return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((item) => search.append(key, String(item)));
    else search.set(key, String(value));
  }
  const suffix = search.toString();
  return suffix ? `${path}?${suffix}` as ContractRequestPath : path;
}
