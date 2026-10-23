export type SeoLeadStatus =
  | "new_lead"
  | "consulted"
  | "waiting_decision"
  | "negotiating"
  | "won_pending_setup"
  | "active"
  | "paused"
  | "lost";

export type SeoOpportunityStage = "discovery" | "proposal" | "pnl_review" | "contracting" | "handover" | "active";

export type SeoFollowUpType = "call" | "meeting" | "proposal" | "contract" | "handover";

export type SeoSchoolLead = {
  id: string;
  schoolId: string;
  schoolName: string;
  district: string;
  province: string;
  segment: string;
  contactName: string;
  contactRole: string;
  phone: string;
  source: string;
  ownerName: string;
  status: SeoLeadStatus;
  probability: number;
  expectedStudents: number;
  expectedClasses: number;
  nextFollowUpAt: string;
  lastTouchAt: string;
  notes: string;
  risks: string[];
  version: number;
};

export type SeoRevenueLine = {
  id: string;
  program: string;
  packageName: string;
  classCount: number;
  studentsPerClass: number;
  pricePerStudent: number;
  discountRate: number;
  durationMonths: number;
};

export type SeoCostLine = {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
  durationMonths: number;
  requiredForHandover: boolean;
};

export type SeoOpportunity = {
  id: string;
  leadId: string;
  code: string;
  stage: SeoOpportunityStage;
  academicYear: string;
  contractTerm: string;
  startMonth: string;
  ownerName: string;
  revenueLines: SeoRevenueLine[];
  costLines: SeoCostLine[];
  version: number;
};

export type SeoFollowUp = {
  id: string;
  leadId: string;
  type: SeoFollowUpType;
  title: string;
  dueAt: string;
  ownerName: string;
  done: boolean;
  version: number;
};

export type SeoHandoverRequest = {
  id: string;
  leadId: string;
  opportunityId: string;
  requestedBy: string;
  requestedAt: string;
  status: "draft" | "ready" | "approved";
  checklist: Array<{
    id: string;
    label: string;
    done: boolean;
  }>;
  version: number;
};

export type SeoCrmWorkspace = {
  leads: SeoSchoolLead[];
  opportunities: SeoOpportunity[];
  followUps: SeoFollowUp[];
  handovers: SeoHandoverRequest[];
};

export type SeoPnlSummary = {
  grossRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginRate: number;
  breakEvenStudents: number;
};
