import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalRetryPlayer } from "@/components/quiz/review/local-retry-player";
import { localQuizAttemptStore, offlineQuizAttemptQueue } from "@/features/lcms/quiz/quiz-runtime";
import { buildReviewFixture } from "@/test/fixtures/quiz-review-fixture";

const { questions } = buildReviewFixture();

afterEach(() => vi.restoreAllMocks());

describe("LocalRetryPlayer (D12: practice on this device only)", () => {
  it("runs the subset in order as practice: check with Kết quả, no auto-advance", () => {
    render(<LocalRetryPlayer questions={questions} indices={[6, 36, 53]} onExit={vi.fn()} />);
    expect(screen.getByText("Câu 1/3 · câu 7 trong bài")).toBeTruthy();
    const check = screen.getByRole("button", { name: "Kết quả" }) as HTMLButtonElement;
    expect(check.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Phương án đúng/ }));
    fireEvent.click(check);
    expect(screen.getByText("Chính xác!")).toBeTruthy();
    expect(screen.getByText("Câu 1/3 · câu 7 trong bài")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Câu tiếp" }));
    expect(screen.getByText("Câu 2/3 · câu 37 trong bài")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Phương án sai/ }));
    fireEvent.click(screen.getByRole("button", { name: "Kết quả" }));
    expect(screen.getByText("Chưa đúng, gần rồi!")).toBeTruthy();
    expect(screen.getByText("Bạn chọn")).toBeTruthy();
    expect(screen.getByText("Đáp án đúng")).toBeTruthy();
    expect(document.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
  });

  it("never writes the attempt store, the offline queue or the network", () => {
    const storeSpies = Object.keys(localQuizAttemptStore).map((key) =>
      vi.spyOn(localQuizAttemptStore, key as keyof typeof localQuizAttemptStore),
    );
    const enqueue = vi.spyOn(offlineQuizAttemptQueue, "enqueue");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const onExit = vi.fn();
    render(<LocalRetryPlayer questions={questions} indices={[6, 11]} onExit={onExit} />);
    for (let step = 0; step < 2; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: /Phương án sai/ }));
      fireEvent.click(screen.getByRole("button", { name: "Kết quả" }));
      if (step === 0) fireEvent.click(screen.getByRole("button", { name: "Câu tiếp" }));
    }
    expect(screen.getByText("Xong 2/2 câu · đúng 0")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Về xem lại" }));
    expect(onExit).toHaveBeenCalled();
    for (const spy of storeSpies) expect(spy).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not import any persistence or API module", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/quiz/review/local-retry-player.tsx"), "utf8");
    expect(source).not.toMatch(/quiz-runtime|@\/lib\/api|graphql|indexeddb|localStorage/i);
  });
});
