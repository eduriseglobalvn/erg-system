import { expect, test } from "vitest";

import type { RecipientCard } from "../api/campaign-types";
import { type AudienceDraft, addPicked, allowedScopes, emptyDraft, groupKeyOf, removePickedGroup, toCampaignAudience } from "./audience-draft";

const card = (userId: string, meta = "Học sinh · 7A · HS1", role = "STUDENT"): RecipientCard => ({ userId, displayName: userId, role, meta });

test("addPicked de-duplicates by userId", () => {
  const once = addPicked(emptyDraft("PEOPLE"), [card("u1"), card("u2")]);
  const twice = addPicked(once, [card("u1"), card("u3")]);
  expect(twice.picked.map((c) => c.userId)).toEqual(["u1", "u2", "u3"]);
});

test("allowedScopes: teachers only get class, group and people", () => {
  expect(allowedScopes(false)).toEqual(["CLASS", "GROUP", "PEOPLE"]);
  expect(allowedScopes(true)).toEqual(["TENANT", "SCHOOL", "GRADE", "CLASS", "ROLE", "GROUP", "PEOPLE"]);
});

test("TENANT maps to wholeTenant with empty lists", () => {
  const draft: AudienceDraft = { ...emptyDraft("TENANT"), classIds: ["c1"], roles: ["TEACHER"], picked: [card("u1")] };
  expect(toCampaignAudience(draft)).toEqual({
    wholeTenant: true, schoolIds: [], gradeIds: [], classIds: [], groupIds: [], roles: [], userIds: [],
  });
});

test("only the active scope's list is sent, picked people always merge in", () => {
  const draft: AudienceDraft = { ...emptyDraft("CLASS"), classIds: ["c1"], groupIds: ["g1"], picked: [card("u1")] };
  expect(toCampaignAudience(draft)).toMatchObject({ wholeTenant: false, classIds: ["c1"], groupIds: [], userIds: ["u1"] });
});

test("removePickedGroup drops a whole class", () => {
  const draft = addPicked(emptyDraft("PEOPLE"), [card("u1"), card("u2", "Học sinh · 7B · HS2"), card("t1", "Giáo viên · Toán", "TEACHER")]);
  expect(groupKeyOf(card("u1"))).toBe("7A");
  expect(removePickedGroup(draft, "7A").picked.map((c) => c.userId)).toEqual(["u2", "t1"]);
});

test("switching scope stops sending the previous scope's list", () => {
  const draft: AudienceDraft = { ...emptyDraft("CLASS"), classIds: ["c1"], roles: ["TEACHER"] };
  expect(toCampaignAudience(draft)).toMatchObject({ classIds: ["c1"], roles: [] });
  expect(toCampaignAudience({ ...draft, scope: "ROLE" })).toMatchObject({ classIds: [], roles: ["TEACHER"] });
});
