import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  previewUserAccess,
  type AccessManagedUser,
  type AccessModule,
  type EffectiveAccess,
  type UserAccessPolicy,
} from "@/features/lcms/admin-operations/api/access-management-api";
import type { AdminUserDetail } from "@/features/lcms/admin-operations/api/user-admin-api";
import { isSuperAdmin, superAdminEffectiveAccess } from "@/features/lcms/admin-operations/utils/user-access-control-utils";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { queryKeys } from "@/lib/query-keys";
import { QUERY_POLICIES } from "@/lib/query-policy";

/** Keeps `effective` in sync with the draft policies (server preview), or the no-policy baseline. */
export function useEffectiveAccessPreview({
  accountId,
  modules,
  policies,
  selectedUserDetail,
  selectedUserId,
  setEffective,
  tenantId,
  users,
}: {
  accountId: string;
  modules?: AccessModule[];
  policies: UserAccessPolicy[];
  selectedUserDetail: AdminUserDetail | null;
  selectedUserId: string;
  setEffective: (effective: EffectiveAccess) => void;
  tenantId: string;
  users: AccessManagedUser[];
}) {
  const queryClient = useQueryClient();
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    if (!policies.length) {
      const roleSource = selectedUserDetail ?? users.find((user) => user.id === selectedUserId);
      paceStateUpdate(() => {
        setEffective(isSuperAdmin(roleSource) ? superAdminEffectiveAccess(modules) : { highestScope: "none", modules: [], permissions: [] });
      });
      return;
    }

    let cancelled = false;
    queryClient
      .fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.preview(policies, tenantId, accountId),
        queryFn: ({ signal }) => previewUserAccess({ policies }, signal),
        staleTime: QUERY_POLICIES.realtime.staleTime,
      })
      .then((result) => {
        if (!cancelled) setEffective(result);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [accountId, modules, paceStateUpdate, policies, queryClient, selectedUserDetail, selectedUserId, setEffective, tenantId, users]);
}
