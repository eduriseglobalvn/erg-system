import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { getCurrentStudentSession } from "@/platform/auth/api/student-auth-storage";
import {
  createLtiRegistration,
  createLearningStandardPackage,
  getLearningStandardPackage,
  ingestXapiStatement,
  launchLearningStandardPackage,
  launchLtiRegistration,
  learningStandardsQueryKeys,
  listLearningStandardPackages,
  validateLearningStandardPackage,
  type CreateLtiRegistrationInput,
  type CreateLearningStandardPackageInput,
  type LearningStandardsPortal,
  type LearningStandardPackage,
  type LearningStandardsRequestContext,
  type LtiLaunchInput,
  type ValidateLearningStandardPackageInput,
  type XapiStatementInput,
} from "@/features/lcms/integrations/learning-standards/api/learning-standards-api";

export type LearningStandardsWorkspace = "ADMIN" | "TEACHER" | "STUDENT";

export type LearningStandardsScope = {
  tenantId: string;
  accountId: string;
  workspace: LearningStandardsWorkspace;
  portal: LearningStandardsPortal;
};

export function useLearningStandardsScope(workspace: LearningStandardsWorkspace): LearningStandardsScope {
  const portal: LearningStandardsPortal = workspace === "ADMIN" ? "lcms" : workspace === "STUDENT" ? "elearning" : "lms";
  const accountId = workspace === "STUDENT"
    ? getCurrentStudentSession()?.id?.trim() || "anonymous"
    : getCurrentAccount(portal)?.id?.trim() || "anonymous";
  return useMemo(
    () => ({ tenantId: getDefaultTenantId(), accountId, workspace, portal }),
    [accountId, portal, workspace],
  );
}

export function useLearningStandardPackages(scope: LearningStandardsScope, status = "", enabled = true) {
  const normalizedStatus = status.trim().toUpperCase();
  return useQuery({
    queryKey: learningStandardsQueryKeys.packages(scope.tenantId, scope.accountId, scope.workspace, normalizedStatus),
    queryFn: ({ signal }) => listLearningStandardPackages(normalizedStatus, contextFor(scope, signal)),
    enabled,
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useLearningStandardPackage(scope: LearningStandardsScope, packageId: string | undefined) {
  const normalizedPackageId = packageId?.trim() ?? "";
  return useQuery({
    queryKey: learningStandardsQueryKeys.package(scope.tenantId, scope.accountId, scope.workspace, normalizedPackageId),
    queryFn: ({ signal }) => getLearningStandardPackage(normalizedPackageId, contextFor(scope, signal)),
    enabled: Boolean(normalizedPackageId),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useCreateLearningStandardPackage(scope: LearningStandardsScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CreateLearningStandardPackageInput; idempotencyKey: string }) =>
      createLearningStandardPackage(input, idempotencyKey, contextFor(scope)),
    onSuccess: () => invalidateRoot(queryClient, scope),
  });
}

export function useValidateLearningStandardPackage(scope: LearningStandardsScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId, input, idempotencyKey }: { packageId: string; input: ValidateLearningStandardPackageInput; idempotencyKey: string }) =>
      validateLearningStandardPackage(packageId, input, idempotencyKey, contextFor(scope)),
    onSuccess: (_, variables) => {
      void invalidateRoot(queryClient, scope);
      void queryClient.invalidateQueries({ queryKey: learningStandardsQueryKeys.package(scope.tenantId, scope.accountId, scope.workspace, variables.packageId) });
    },
  });
}

export function useLaunchLearningStandardPackage(scope: LearningStandardsScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId }: { packageId: string }) => launchLearningStandardPackage(packageId, contextFor(scope)),
    onSuccess: (value) => {
      void queryClient.invalidateQueries({ queryKey: learningStandardsQueryKeys.package(scope.tenantId, scope.accountId, scope.workspace, value.id) });
    },
  });
}

export function useCreateLtiRegistration(scope: LearningStandardsScope) {
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CreateLtiRegistrationInput; idempotencyKey: string }) =>
      createLtiRegistration(input, idempotencyKey, contextFor(scope)),
  });
}

export function useLaunchLtiRegistration(scope: LearningStandardsScope) {
  return useMutation({
    mutationFn: ({ registrationId, input, idempotencyKey }: { registrationId: string; input: LtiLaunchInput; idempotencyKey: string }) =>
      launchLtiRegistration(registrationId, input, idempotencyKey, contextFor(scope)),
  });
}

export function useIngestXapiStatement(scope: LearningStandardsScope) {
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: XapiStatementInput; idempotencyKey: string }) =>
      ingestXapiStatement(input, idempotencyKey, contextFor(scope)),
  });
}

async function invalidateRoot(queryClient: ReturnType<typeof useQueryClient>, scope: LearningStandardsScope) {
  await queryClient.invalidateQueries({ queryKey: learningStandardsQueryKeys.root(scope.tenantId, scope.accountId, scope.workspace) });
}

function contextFor(scope: LearningStandardsScope, signal?: AbortSignal): LearningStandardsRequestContext {
  return signal ? { portal: scope.portal, signal } : { portal: scope.portal };
}

export type { LearningStandardPackage };
