import {
  apiRequest,
  type ApiRequestOptions,
} from "@/lib/api-client";
import type { ContractMethod, ContractPath, ContractRequestPath } from "@/lib/api/contract-types";

type ClientConfig = Pick<ApiRequestOptions, "portal" | "auth">;

export function createApiClient(config: ClientConfig) {
  const stableConfig = { ...config };

  return {
    request<T = unknown, P extends ContractPath = ContractPath, M extends ContractMethod<P> = "get">(
      path: P | `${P}?${string}`,
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
