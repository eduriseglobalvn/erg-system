import { describe, expect, it } from "vitest";

import {
  calculateSeoPnlSummary,
  costTotal,
  revenueGross,
  revenueNet,
} from "@/features/crm/seo/api/seo-crm-pnl";
import { seoOpportunities } from "@/features/crm/seo/api/seo-crm-fixtures";
import type { SeoOpportunity } from "@/features/crm/seo/types/seo-crm-types";

describe("CRM SEO P&L baseline", () => {
  it("keeps the seeded opportunity arithmetic stable before API extraction", () => {
    const opportunity = seoOpportunities[0]! as SeoOpportunity;
    const summary = calculateSeoPnlSummary(opportunity);

    expect(revenueGross(opportunity.revenueLines[0]!)).toBe(3_990_000_000);
    expect(revenueNet(opportunity.revenueLines[0]!)).toBe(3_670_800_000);
    expect(costTotal(opportunity.costLines[0]!)).toBe(360_000_000);
    expect(summary).toMatchObject({
      grossRevenue: 4_096_400_000,
      totalDiscount: 319_200_000,
      netRevenue: 3_777_200_000,
      totalCost: 411_600_000,
      grossProfit: 3_365_600_000,
      breakEvenStudents: 699,
    });
    expect(summary.marginRate).toBeCloseTo(3_365_600_000 / 3_777_200_000, 10);
  });
});
