import type { components } from "@/lib/api/generated/erg-openapi";

type Schemas = components["schemas"];

export type CampaignAudience = Schemas["CampaignAudience"];
export type AudienceBreakdown = Schemas["AudienceBreakdown"];
export type RecipientCard = Schemas["RecipientCard"];
export type ResolvePeopleResult = Schemas["ResolvePeopleResult"];
export type AmbiguousLine = Schemas["AmbiguousLine"];
export type CampaignDraftRequest = Schemas["CampaignDraftRequest"];
export type CampaignResponse = Schemas["CampaignResponse"];
export type CampaignSummary = Schemas["CampaignSummaryResponse"];
export type CampaignRecipient = Schemas["CampaignRecipientResponse"];
export type CampaignPage = Schemas["PageResponseCampaignResponse"];
export type CampaignRecipientPage = Schemas["PageResponseCampaignRecipientResponse"];
export type CampaignStatus = NonNullable<CampaignResponse["status"]>;
export type CampaignPriority = NonNullable<CampaignResponse["priority"]>;

/** Mailbox tab on the campaign list. */
export type CampaignBox = "SENT" | "SCHEDULED" | "DRAFT";
/** Recipient filter on the campaign detail (server vocabulary). */
export type CampaignRecipientFilter = "ALL" | "UNREAD" | "UNACKED";
