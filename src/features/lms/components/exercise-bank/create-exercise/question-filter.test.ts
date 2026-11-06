import { describe, expect, it } from "vitest";
import { filterBankQuestions } from "./question-filter";
import type { BankQuestion, BankSubject } from "./types";

const subject = { id: "s1", label: "IC3 GS6" } as BankSubject;
const q = (over: Record<string, unknown>) =>
  ({
    id: "q",
    subjectId: "s1",
    subjectLabel: "IC3 GS6",
    levelId: "l1",
    levelLabel: "Level 1",
    categoryId: "c1",
    categoryLabel: "Mạng",
    difficulty: "core",
    stem: "Router là gì?",
    tags: ["network"],
    ...over,
  }) as BankQuestion;
const all = [
  q({ id: "a" }),
  q({ id: "b", levelId: "l2", levelLabel: "Level 2", categoryId: "c2", categoryLabel: "Phần cứng", difficulty: "stretch", stem: "RAM", tags: [] }),
  q({ id: "c", subjectId: "other", subjectLabel: "Khác" }),
];
const none = { selectedLevel: "all", selectedTopic: "all", selectedDifficulty: "all", questionSearch: "" };
const ids = (r: BankQuestion[]) => r.map((x) => x.id);

describe("filterBankQuestions", () => {
  it("returns [] without a subject and excludes other subjects", () => {
    expect(filterBankQuestions(all, undefined, none)).toEqual([]);
    expect(ids(filterBankQuestions(all, subject, none))).toEqual(["a", "b"]);
  });
  it("filters by level, topic and difficulty", () => {
    expect(ids(filterBankQuestions(all, subject, { ...none, selectedLevel: "l2" }))).toEqual(["b"]);
    expect(ids(filterBankQuestions(all, subject, { ...none, selectedTopic: "Mạng" }))).toEqual(["a"]);
    expect(ids(filterBankQuestions(all, subject, { ...none, selectedDifficulty: "stretch" }))).toEqual(["b"]);
  });
  it("searches stem, category, level and tags case-insensitively", () => {
    expect(ids(filterBankQuestions(all, subject, { ...none, questionSearch: "ROUTER" }))).toEqual(["a"]);
    expect(ids(filterBankQuestions(all, subject, { ...none, questionSearch: "phần cứng" }))).toEqual(["b"]);
    expect(ids(filterBankQuestions(all, subject, { ...none, questionSearch: "level 2" }))).toEqual(["b"]);
    expect(ids(filterBankQuestions(all, subject, { ...none, questionSearch: "NETWORK" }))).toEqual(["a"]);
    expect(ids(filterBankQuestions(all, subject, { ...none, questionSearch: "   " }))).toEqual(["a", "b"]);
  });
});
