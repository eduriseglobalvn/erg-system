import {
  apiRequest,
  type ApiRequestOptions,
} from "@/lib/api-client";
import type { ContractMethod, ContractPath, ApiResponseData } from "@/lib/api/contract-types";

type ClientConfig = Pick<ApiRequestOptions, "portal" | "auth">;

export function createApiClient(config: ClientConfig) {
  const stableConfig = { ...config };

  return {
    request<P extends ContractPath, M extends ContractMethod<P>>(
      path: P,
      init: Omit<ApiRequestOptions, "portal" | "auth"> & { method: Uppercase<M> },
    ): Promise<ApiResponseData<P, M>> {
      return apiRequest<ApiResponseData<P, M>>(path, {
        ...init,
        portal: stableConfig.portal,
        auth: stableConfig.auth,
      });
    },
  };
}
