import { describe, expect, it } from "vitest";
import { featureMessages, getFeatureMessage } from "@/platform/i18n/feature-messages";

describe("feature i18n registry", () => {
  it("indexes messages by feature namespace without duplicating source data", () => {
    expect(featureMessages.common["common.save"]?.vi).toBeTruthy();
    expect(featureMessages.quiz["quiz.choices"]?.en).toBeTruthy();
    expect(featureMessages.auth["auth.login"]?.vi).toBeTruthy();
  });

  it("falls back to the canonical message map for keys outside a namespace", () => {
    expect(getFeatureMessage("common", "common.save", "vi")).toBe(featureMessages.common["common.save"]?.vi);
  });
});
