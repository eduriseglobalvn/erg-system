import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePlayerKeyboard, type UsePlayerKeyboardArgs } from "./use-player-keyboard";

function mount(overrides: Partial<UsePlayerKeyboardArgs> = {}) {
  const setCurrentIndex = vi.fn();
  renderHook(() =>
    usePlayerKeyboard({
      allQuestionsAnswered: false,
      attemptExpired: false,
      attemptCompleted: false,
      beginAttempt: vi.fn(),
      finalizeAttempt: vi.fn(),
      isTestingMode: true,
      isTrainingMode: false,
      loadStatus: "ready",
      questionsLength: 5,
      requestSubmit: vi.fn(),
      reviewingSubmittedAttempt: false,
      started: true,
      submitCurrentTrainingQuestion: vi.fn(),
      submitDialogMode: null,
      submitFailed: false,
      submitting: false,
      setCurrentIndex,
      ...overrides,
    }),
  );
  return setCurrentIndex;
}

describe("usePlayerKeyboard arrows", () => {
  it("moves with ArrowLeft/ArrowRight and clamps to the question range", () => {
    const setCurrentIndex = mount();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(setCurrentIndex).toHaveBeenCalledTimes(2);
    expect(setCurrentIndex.mock.calls[0][0](4)).toBe(4);
    expect(setCurrentIndex.mock.calls[0][0](1)).toBe(2);
    expect(setCurrentIndex.mock.calls[1][0](0)).toBe(0);
  });

  it("ignores arrows while typing in an input", () => {
    const setCurrentIndex = mount();
    const input = document.body.appendChild(document.createElement("input"));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    input.remove();
    expect(setCurrentIndex).not.toHaveBeenCalled();
  });
});

describe("usePlayerKeyboard arrows (modes)", () => {
  it("also navigates in training mode and ignores textarea/contenteditable", () => {
    const setCurrentIndex = mount({ isTestingMode: false, isTrainingMode: true });
    const area = document.body.appendChild(document.createElement("textarea"));
    area.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    area.remove();
    expect(setCurrentIndex).not.toHaveBeenCalled();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(setCurrentIndex).toHaveBeenCalledOnce();
  });
});

describe("usePlayerKeyboard web shortcuts", () => {
  const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = window) =>
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));

  function setup(overrides: Partial<UsePlayerKeyboardArgs> = {}) {
    const fns = { onPickOption: vi.fn(), onToggleFlag: vi.fn(), focusGoTo: vi.fn() };
    mount({ ...fns, ...overrides });
    return fns;
  }

  it("picks the n-th option with 1-9, flags with F/f, focuses go-to with N", () => {
    const fns = setup();
    press("2");
    press("9");
    press("F");
    press("f");
    press("N");
    expect(fns.onPickOption.mock.calls).toEqual([[1], [8]]);
    expect(fns.onToggleFlag).toHaveBeenCalledTimes(2);
    expect(fns.focusGoTo).toHaveBeenCalledOnce();
  });

  it("ignores 0 and keys it was not given a handler for", () => {
    const fns = setup({ focusGoTo: undefined });
    press("0");
    press("n");
    expect(fns.onPickOption).not.toHaveBeenCalled();
    expect(fns.focusGoTo).not.toHaveBeenCalled();
  });

  it.each(["input", "textarea"])("does nothing while typing in a %s", (tag) => {
    const fns = setup();
    const setCurrentIndex = mount();
    const el = document.body.appendChild(document.createElement(tag));
    for (const key of ["2", "F", "N", "ArrowLeft"]) press(key, {}, el);
    el.remove();
    expect(fns.onPickOption).not.toHaveBeenCalled();
    expect(fns.onToggleFlag).not.toHaveBeenCalled();
    expect(fns.focusGoTo).not.toHaveBeenCalled();
    expect(setCurrentIndex).not.toHaveBeenCalled();
  });

  it("does nothing inside a contenteditable element", () => {
    const fns = setup();
    const el = document.body.appendChild(document.createElement("div"));
    el.contentEditable = "true";
    // jsdom does not implement isContentEditable, so mirror it.
    Object.defineProperty(el, "isContentEditable", { value: true });
    for (const key of ["2", "F", "N"]) press(key, {}, el);
    el.remove();
    expect(fns.onPickOption).not.toHaveBeenCalled();
    expect(fns.onToggleFlag).not.toHaveBeenCalled();
    expect(fns.focusGoTo).not.toHaveBeenCalled();
  });

  it.each(["ctrlKey", "metaKey", "altKey"] as const)("ignores shortcuts with %s held", (modifier) => {
    const fns = setup();
    for (const key of ["2", "F", "N"]) press(key, { [modifier]: true });
    expect(fns.onPickOption).not.toHaveBeenCalled();
    expect(fns.onToggleFlag).not.toHaveBeenCalled();
    expect(fns.focusGoTo).not.toHaveBeenCalled();
  });

  it("never picks an option while reviewing or submitting, and never flags while reviewing (no flag control there)", () => {
    const reviewing = setup({ attemptCompleted: true, reviewingSubmittedAttempt: true });
    press("2");
    press("f");
    expect(reviewing.onPickOption).not.toHaveBeenCalled();
    expect(reviewing.onToggleFlag).not.toHaveBeenCalled();

    const submitting = setup({ submitting: true });
    press("3");
    expect(submitting.onPickOption).not.toHaveBeenCalled();
  });
});

describe("usePlayerKeyboard submit dialog Enter", () => {
  function setup() {
    const finalizeAttempt = vi.fn();
    mount({ finalizeAttempt, submitDialogMode: "confirm" });
    return finalizeAttempt;
  }
  const enter = (target: EventTarget) => target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

  it("confirms with Enter when focus is on the page body", () => {
    const finalizeAttempt = setup();
    enter(document.body);
    expect(finalizeAttempt).toHaveBeenCalledOnce();
  });

  it.each([
    ["button", () => document.createElement("button")],
    ["link", () => Object.assign(document.createElement("a"), { href: "#x" })],
    ["role=button", () => Object.assign(document.createElement("div"), { role: "button" })],
  ])("does not submit when Enter lands on a %s (it activates that control)", (_name, make) => {
    const finalizeAttempt = setup();
    const el = document.body.appendChild(make());
    const inner = el.appendChild(document.createElement("span"));
    enter(inner);
    el.remove();
    expect(finalizeAttempt).not.toHaveBeenCalled();
  });
});

describe("usePlayerKeyboard repeat and shift", () => {
  const press = (key: string, init: KeyboardEventInit = {}) =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));

  function setup() {
    const fns = { onPickOption: vi.fn(), onToggleFlag: vi.fn(), focusGoTo: vi.fn() };
    const setCurrentIndex = mount(fns);
    return { ...fns, setCurrentIndex };
  }

  it("ignores auto-repeat for F, N and digits", () => {
    const fns = setup();
    press("f", { repeat: true });
    press("n", { repeat: true });
    press("2", { repeat: true });
    expect(fns.onToggleFlag).not.toHaveBeenCalled();
    expect(fns.focusGoTo).not.toHaveBeenCalled();
    expect(fns.onPickOption).not.toHaveBeenCalled();
    press("f");
    expect(fns.onToggleFlag).toHaveBeenCalledOnce();
  });

  it("keeps repeating arrows", () => {
    const fns = setup();
    press("ArrowRight", { repeat: true });
    expect(fns.setCurrentIndex).toHaveBeenCalledOnce();
  });

  it("accepts Shift+F and Shift+N but never with ctrl, and still ignores Shift+arrow/digit", () => {
    const fns = setup();
    press("F", { shiftKey: true });
    press("N", { shiftKey: true });
    expect(fns.onToggleFlag).toHaveBeenCalledOnce();
    expect(fns.focusGoTo).toHaveBeenCalledOnce();
    press("F", { ctrlKey: true, shiftKey: true });
    press("f", { ctrlKey: true });
    expect(fns.onToggleFlag).toHaveBeenCalledOnce();
    press("ArrowRight", { shiftKey: true });
    press("2", { shiftKey: true });
    expect(fns.setCurrentIndex).not.toHaveBeenCalled();
    expect(fns.onPickOption).not.toHaveBeenCalled();
  });
});
