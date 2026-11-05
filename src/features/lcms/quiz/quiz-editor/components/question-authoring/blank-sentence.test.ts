import { describe, expect, it } from "vitest";
import {
  addBlank,
  blankWord,
  rebaseBlanks,
  removeBlank,
  sentenceParts,
  setBlankText,
  type BlankSentence,
} from "./blank-sentence";

const TEXT = "Hàm tính trung bình là AVERAGE.";
const START = TEXT.indexOf("AVERAGE");
const END = START + 7;
const S: BlankSentence = { text: TEXT, blanks: [{ id: "b1", start: START, end: END }] };
const word = (s: BlankSentence) => blankWord(s, s.blanks[0]);

describe("rebaseBlanks", () => {
  it("shifts a blank when text is typed before it", () => {
    const next = rebaseBlanks(S, `x${TEXT}`, 1);
    expect(next.blanks[0]).toMatchObject({ start: START + 1, end: END + 1 });
    expect(word(next)).toBe("AVERAGE");
  });

  it("keeps the blank when typing at the end or right after it", () => {
    const atEnd = rebaseBlanks(S, `${TEXT}!`, TEXT.length + 1);
    expect(atEnd.blanks[0]).toMatchObject({ start: START, end: END });
    const after = rebaseBlanks(S, `${TEXT.slice(0, END)}.${TEXT.slice(END)}`, END + 1);
    expect(word(after)).toBe("AVERAGE");
  });

  it("grows the blank for a letter typed inside it, and uses the diff when the caret is wrong", () => {
    const next = `${TEXT.slice(0, END - 1)}E${TEXT.slice(END - 1)}`;
    expect(word(rebaseBlanks(S, next, END))).toBe("AVERAGEE");
    expect(word(rebaseBlanks(S, next, next.length))).toBe("AVERAGE");
  });

  it("replaces the word when it is selected and retyped", () => {
    const next = `${TEXT.slice(0, START)}SUM${TEXT.slice(END)}`;
    expect(word(rebaseBlanks(S, next, START + 3))).toBe("SUM");
  });

  it("drops the blank when a deletion crosses its edge", () => {
    const from = TEXT.indexOf("à AVER");
    const next = TEXT.slice(0, from) + TEXT.slice(from + 6);
    const r = rebaseBlanks(S, next, from);
    expect(r.blanks).toEqual([]);
    expect(r.text).toBe(next);
  });

  it("drops the blank when its whole word is deleted", () => {
    const next = TEXT.slice(0, START) + TEXT.slice(END);
    expect(rebaseBlanks(S, next, START).blanks).toEqual([]);
  });

  it("keeps the range on a same-length replacement inside the word", () => {
    const next = `${TEXT.slice(0, START)}Â${TEXT.slice(START + 1)}`;
    const r = rebaseBlanks(S, next, START + 1);
    expect(r.blanks[0]).toMatchObject({ start: START, end: END });
  });
});

describe("addBlank / removeBlank", () => {
  const T = "Thủ đô  Hà Nội ";
  it("trims the range to the word", () => {
    const r = addBlank({ text: T, blanks: [] }, 3, 8, "n1");
    expect(r && blankWord(r, r.blanks[0])).toBe("đô");
  });
  it("rejects whitespace-only and overlapping ranges", () => {
    expect(addBlank({ text: T, blanks: [] }, 6, 8, "n1")).toBeNull();
    expect(addBlank(S, START + 2, END + 1, "n2")).toBeNull();
  });
  it("inserts in order and removeBlank keeps the text", () => {
    const r = addBlank(S, 0, 3, "n0")!;
    expect(r.blanks.map((b) => b.id)).toEqual(["n0", "b1"]);
    expect(removeBlank(r, "n0")).toEqual(S);
  });
});

describe("sentenceParts / setBlankText", () => {
  it("splits around blanks", () => {
    expect(sentenceParts(S)).toEqual(["Hàm tính trung bình là ", "."]);
    expect(sentenceParts({ text: "abc", blanks: [] })).toEqual(["abc"]);
  });
  it("replaces a blank word and shifts later blanks", () => {
    const two: BlankSentence = {
      text: "A AVERAGE B C",
      blanks: [
        { id: "b1", start: 2, end: 9 },
        { id: "b2", start: 12, end: 13 },
      ],
    };
    const r = setBlankText(two, "b1", "SUM");
    expect(r.text).toBe("A SUM B C");
    expect(r.blanks).toEqual([
      { id: "b1", start: 2, end: 5 },
      { id: "b2", start: 8, end: 9 },
    ]);
  });
});
