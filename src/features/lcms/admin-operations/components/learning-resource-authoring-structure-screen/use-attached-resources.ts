import { useEffect, useState } from "react";

import {
  loadLearningResourceResourceDetail,
  type LearningResourceResourceCard,
} from "@/features/lms/learning-resources/api/learning-resource-authoring-api";
import type { AttachedResourceItem } from "@/features/lcms/admin-operations/types/learning-resource-authoring";

export function useAttachedResources(currentResources: LearningResourceResourceCard[]) {
  const [attachedResources, setAttachedResources] = useState<Record<string, AttachedResourceItem>>({});

  useEffect(() => {
    let cancelled = false;
    const missingDetails = currentResources.filter((resource) => !attachedResources[resource.id]);
    if (!missingDetails.length) return;

    void Promise.all(
      missingDetails.map(async (resource) => {
        try {
          const detail = await loadLearningResourceResourceDetail(resource.id);
          const asset = detail.assets[0];
          return [
            resource.id,
            {
              ...resource,
              detail,
              asset,
              linkUrl: asset?.storageUrl || asset?.upstreamUrl,
            } satisfies AttachedResourceItem,
          ] as const;
        } catch {
          return [resource.id, { ...resource, linkUrl: undefined } satisfies AttachedResourceItem] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setAttachedResources((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [attachedResources, currentResources]);

  return [attachedResources, setAttachedResources] as const;
}
