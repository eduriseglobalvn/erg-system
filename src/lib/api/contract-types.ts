import type { paths } from "@/lib/api/generated/erg-openapi";

export type ContractPath = keyof paths;
export type ContractRequestPath = ContractPath | `${ContractPath}?${string}`;
export type ContractMethod<P extends ContractPath> = {
  [M in keyof paths[P]]: M extends "get" | "post" | "put" | "patch" | "delete"
    ? paths[P][M] extends never | undefined ? never : M
    : never;
}[keyof paths[P]];

type Operation<P extends ContractPath, M extends ContractMethod<P>> =
  NonNullable<paths[P][M]>;

type SuccessResponse<P extends ContractPath, M extends ContractMethod<P>> =
  Operation<P, M> extends { responses: infer Responses }
    ? Responses extends { 200: infer Response }
      ? Response extends { content: infer Content }
        ? Content[keyof Content]
        : never
      : never
    : never;

export type ApiResponseData<P extends ContractPath, M extends ContractMethod<P>> =
  SuccessResponse<P, M> extends { data?: infer Data }
    ? Data
    : SuccessResponse<P, M> extends { data: infer Data }
      ? Data
      : SuccessResponse<P, M>;

type OperationRequestBody<P extends ContractPath, M extends ContractMethod<P>> =
  Operation<P, M> extends { requestBody?: { content: infer Content } }
    ? Content extends Record<string, infer Body> ? Body : never
    : never;

export type ApiOperationBody<P extends ContractPath, M extends ContractMethod<P>> = OperationRequestBody<P, M>;

export type ApiOperationOptions<P extends ContractPath, M extends ContractMethod<P>> = {
  body?: ApiOperationBody<P, M>;
  headers?: HeadersInit;
  query?: Operation<P, M> extends { parameters: { query?: infer Query } } ? Query : never;
  signal?: AbortSignal;
};

export function encodeApiPathSegment(value: string) {
  return encodeURIComponent(value);
}
