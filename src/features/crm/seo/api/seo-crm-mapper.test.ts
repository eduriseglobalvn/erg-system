import { describe, expect, it } from "vitest";

import { mapSeoCrmWorkspaceDto } from "@/features/crm/seo/api/seo-crm-mapper";

describe("CRM workspace DTO mapper", () => {
  it("validates and maps transport DTOs into stable domain records", () => {
    const result = mapSeoCrmWorkspaceDto({
      leads: [{
        id: "lead-1", schoolId: "school-1", schoolName: "THCS ERG", district: "1", province: "HCM",
        segment: "THCS", contactName: "Cô An", contactRole: "Hiệu trưởng", phone: "0901", source: "web",
        ownerName: "seo-1", status: "negotiating", probability: 72, expectedStudents: 300, expectedClasses: 8,
        nextFollowUpAt: "2026-08-02", lastTouchAt: "2026-07-30T02:00:00Z", notes: "Đang chốt",
        risks: ["Ngân sách"], version: 3,
      }],
      opportunities: [{
        id: "opp-1", leadId: "lead-1", code: "CRM-001", stage: "proposal", academicYear: "2026-2027",
        contractTerm: "10 tháng", startMonth: "2026-08", ownerName: "seo-1", version: 2,
        revenueLines: [{ id: "r1", program: "IC3", packageName: "Core", classCount: 8, studentsPerClass: 35,
          pricePerStudent: 1000000, discountRate: 0.1, durationMonths: 10 }],
        costLines: [{ id: "c1", category: "Nhân sự", description: "Giáo viên", quantity: 2,
          unitCost: 12000000, durationMonths: 10, requiredForHandover: true }],
      }],
      followUps: [{ id: "follow-1", leadId: "lead-1", type: "meeting", title: "Chốt ngân sách", dueAt: "2026-08-02", ownerName: "seo-1", done: false, version: 1 }],
      handovers: [{ id: "handover-1", leadId: "lead-1", opportunityId: "opp-1", requestedBy: "seo-1", requestedAt: "2026-07-30T02:00:00Z", status: "ready", checklist: [{ id: "contract", label: "Hợp đồng", done: true }], version: 1 }],
    });

    expect(result.leads[0]).toMatchObject({ id: "lead-1", status: "negotiating", lastTouchAt: "2026-07-30", version: 3 });
    expect(result.opportunities[0]?.revenueLines[0]?.discountRate).toBe(0.1);
    expect(result.followUps[0]?.type).toBe("meeting");
    expect(result.handovers[0]?.status).toBe("ready");
  });

  it("rejects unknown enum values at the transport boundary", () => {
    expect(() => mapSeoCrmWorkspaceDto({ leads: [{ id: "lead-1", schoolId: "school-1", status: "invented" }] }))
      .toThrow(/lead status/i);
  });
});
