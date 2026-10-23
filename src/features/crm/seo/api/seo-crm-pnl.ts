import type { SeoCostLine, SeoOpportunity, SeoPnlSummary, SeoRevenueLine } from "@/features/crm/seo/types/seo-crm-types";

export function calculateSeoPnlSummary(opportunity: SeoOpportunity): SeoPnlSummary {
  const grossRevenue = opportunity.revenueLines.reduce((sum, line) => sum + revenueGross(line), 0);
  const totalDiscount = opportunity.revenueLines.reduce((sum, line) => sum + revenueGross(line) * line.discountRate, 0);
  const netRevenue = grossRevenue - totalDiscount;
  const totalCost = opportunity.costLines.reduce((sum, line) => sum + costTotal(line), 0);
  const grossProfit = netRevenue - totalCost;
  const averageNetPrice = opportunity.revenueLines.reduce(
    (sum, line) => sum + line.pricePerStudent * (1 - line.discountRate), 0,
  ) / Math.max(1, opportunity.revenueLines.length);

  return {
    grossRevenue,
    totalDiscount,
    netRevenue,
    totalCost,
    grossProfit,
    marginRate: netRevenue > 0 ? grossProfit / netRevenue : 0,
    breakEvenStudents: averageNetPrice > 0 ? Math.ceil(totalCost / averageNetPrice) : 0,
  };
}

export function revenueGross(line: SeoRevenueLine) {
  return line.classCount * line.studentsPerClass * line.pricePerStudent * line.durationMonths;
}

export function revenueNet(line: SeoRevenueLine) {
  return revenueGross(line) * (1 - line.discountRate);
}

export function costTotal(line: SeoCostLine) {
  return line.quantity * line.unitCost * line.durationMonths;
}
