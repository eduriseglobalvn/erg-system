import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { QuestionBankTopicList } from "./question-bank-topic-list";
import { enCopy } from "./question-bank-copy";

const copy = enCopy;

function renderList(topics: Array<{ id: string; label: string; levelId: string; questionCount?: number }>) {
  return render(
    <QuestionBankTopicList
      activeCount={7}
      activeTopicId="t1"
      copy={copy}
      levelLabel="Lớp 7"
      onPick={() => undefined}
      topics={topics}
    />,
  );
}

test("shows a count on every topic, the filtered total on the active one, and the level total on 'all'", () => {
  renderList([
    { id: "t1", label: "Chủ đề 1", levelId: "l", questionCount: 9 },
    { id: "t2", label: "Chủ đề 2", levelId: "l", questionCount: 4 },
  ]);

  expect(screen.getByRole("button", { name: /Chủ đề 1/ })).toHaveTextContent("7");
  expect(screen.getByRole("button", { name: /Chủ đề 2/ })).toHaveTextContent("4");
  expect(screen.getByRole("button", { name: new RegExp(copy.allTopics) })).toHaveTextContent("13");
});

test("shows no count for topics the API did not count", () => {
  renderList([{ id: "t2", label: "Chủ đề B", levelId: "l" }]);

  expect(screen.getByRole("button", { name: "Chủ đề B" })).not.toHaveTextContent(/\d/);
});
