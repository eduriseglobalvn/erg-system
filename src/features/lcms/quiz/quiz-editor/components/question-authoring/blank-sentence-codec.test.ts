import { describe, expect, it } from "vitest";

import type { Question } from "@/domain/quiz/types";
import { rebaseBlanks, setBlankText, type BlankSentence } from "./blank-sentence";
import { patchBlank, readBlankSentence, selectBlankOption, writeBlankSentence } from "./blank-sentence-codec";

const TEXT = "Hàm tính trung bình là AVERAGE, hàm tính tổng là SUM.";
const at = (word: string) => ({ start: TEXT.indexOf(word), end: TEXT.indexOf(word) + word.length });
const S: BlankSentence = { text: TEXT, blanks: [{ id: "b1", ...at("AVERAGE") }, { id: "b2", ...at("SUM") }] };

const base = { id: "q1", title: "", points: 1, feedback: { correct: "", incorrect: "", partial: "" } };
const fill: Question = { ...base, kind: "fill_blank", textBlanks: [] };
const select: Question = { ...base, kind: "select_from_lists", inlineBlanks: [] };
const drag: Question = { ...base, kind: "drag_words", wordSlots: [], wordBank: [] };

describe.each([
  ["fill", fill],
  ["select", select],
  ["drag", drag],
])("%s codec", (_name, question) => {
  it("round-trips a sentence", () => {
    expect(readBlankSentence(writeBlankSentence(question, S))).toEqual(S);
  });

  it("never stores a blank word in sentenceParts", () => {
    const json = JSON.stringify(writeBlankSentence(question, S).sentenceParts);
    expect(json).not.toContain("AVERAGE");
    expect(json).not.toContain("SUM");
  });
});

describe("old data", () => {
  const seed: Question = {
    ...fill,
    textBlanks: [
      { id: "t1", label: "", prefix: "Em nên dùng", correctAnswers: ["mật khẩu"], suffix: "mạnh" },
      { id: "t2", label: "", prefix: "và bật xác thực", correctAnswers: ["hai lớp", "2 lớp"], suffix: "khi có thể." },
    ],
  };
  const SENTENCE = "Em nên dùng mật khẩu mạnh và bật xác thực hai lớp khi có thể.";

  it("reads the seed shape as one sentence and writes it back", () => {
    const read = readBlankSentence(seed);
    expect(read.text).toBe(SENTENCE);
    const written = writeBlankSentence(seed, read);
    expect(readBlankSentence(written).text).toBe(SENTENCE);
    expect(written.textBlanks![1].correctAnswers).toEqual(["hai lớp", "2 lớp"]);
  });

  const oldSelect: Question = {
    ...select,
    inlineBlanks: [{ id: "i1", statement: "Bản sao bị đăng lên mạng.", selectPosition: "before", options: ["yes", "no"], correctOptionId: "yes" }],
  };

  it("reads a select blank placed before its statement", () => {
    expect(readBlankSentence(oldSelect).text).toBe("yes Bản sao bị đăng lên mạng.");
  });

  it("picks another option as correct without changing the options", () => {
    const out = selectBlankOption(oldSelect, "i1", "no");
    expect(out.inlineBlanks![0].options).toEqual(["yes", "no"]);
    expect(out.inlineBlanks![0].correctOptionId).toBe("no");
    expect(readBlankSentence(out).text).toBe("no Bản sao bị đăng lên mạng.");
  });

  it("renames only the correct option while typing, even past another option's text", () => {
    let q: Question = {
      ...select,
      inlineBlanks: [{ id: "i1", statement: "Hàm", selectPosition: "after", options: ["MEAN", "MIN", "MAX"], correctOptionId: "MIN" }],
    };
    for (const typed of ["MI", "M", "MA", "MAX", "MAXI", "MAXIM", "MAXIMU", "MAXIMUM"]) {
      q = writeBlankSentence(q, setBlankText(readBlankSentence(q), "i1", typed));
    }
    expect(q.inlineBlanks![0].options).toEqual(["MEAN", "MAXIMUM", "MAX"]);
    expect(q.inlineBlanks![0].correctOptionId).toBe("MAXIMUM");
  });

  it("keeps a fill alternate when the word is edited", () => {
    const q = writeBlankSentence(fill, S);
    const withAlt = { ...q, textBlanks: q.textBlanks!.map((b, i) => (i === 0 ? { ...b, correctAnswers: [...b.correctAnswers, "TRUNG BÌNH"] } : b)) };
    const out = writeBlankSentence(withAlt, setBlankText(readBlankSentence(withAlt), "b1", "MEAN"));
    expect(out.textBlanks![0].correctAnswers).toEqual(["MEAN", "TRUNG BÌNH"]);
  });

  it("keeps a fill blank's alternates while its word is emptied and retyped", () => {
    const q = writeBlankSentence(fill, S);
    let out: Question = { ...q, textBlanks: q.textBlanks!.map((b, i) => (i === 0 ? { ...b, correctAnswers: [...b.correctAnswers, "TRUNG BÌNH"] } : b)) };
    const { start, end } = at("AVERAGE");
    const edit = (text: string, caret: number) => { out = writeBlankSentence(out, rebaseBlanks(readBlankSentence(out), text, caret)); };
    edit(TEXT.slice(0, start) + TEXT.slice(end), start);
    expect(readBlankSentence(out).blanks.map((b) => b.end - b.start)).toEqual([0, 3]);
    expect(out.textBlanks![0].correctAnswers).toEqual(["", "TRUNG BÌNH"]);
    edit(`${TEXT.slice(0, start)}M${TEXT.slice(end)}`, start + 1);
    expect(readBlankSentence(out)).toEqual({ ...S, text: TEXT.replace("AVERAGE", "M"), blanks: [{ id: "b1", start, end: start + 1 }, { id: "b2", start: S.blanks[1].start - 6, end: S.blanks[1].end - 6 }] });
    expect(out.textBlanks![0].correctAnswers).toEqual(["M", "TRUNG BÌNH"]);
  });

  const emptyAndRetype = (q: Question) => {
    const { start, end } = at("AVERAGE");
    const emptied = writeBlankSentence(q, rebaseBlanks(readBlankSentence(q), TEXT.slice(0, start) + TEXT.slice(end), start));
    const retyped = writeBlankSentence(emptied, rebaseBlanks(readBlankSentence(emptied), `${TEXT.slice(0, start)}M${TEXT.slice(end)}`, start + 1));
    return { emptied, retyped };
  };

  it("keeps a select blank's options while its word is emptied and retyped", () => {
    const q = writeBlankSentence(select, S);
    const { emptied, retyped } = emptyAndRetype({ ...q, inlineBlanks: q.inlineBlanks!.map((b, i) => (i === 0 ? { ...b, options: ["AVERAGE", "MEAN"] } : b)) });
    expect(readBlankSentence(emptied).blanks.map((b) => b.id)).toEqual(["b1", "b2"]);
    expect(emptied.inlineBlanks![0].options).toEqual(["", "MEAN"]);
    expect(retyped.inlineBlanks![0]).toMatchObject({ options: ["M", "MEAN"], correctOptionId: "M" });
  });

  it("keeps a drag slot and its word id while its word is emptied and retyped", () => {
    const q = writeBlankSentence(drag, S);
    const { emptied, retyped } = emptyAndRetype(q);
    expect(emptied.wordSlots).toEqual(q.wordSlots);
    expect(retyped.wordSlots).toEqual(q.wordSlots);
    expect(retyped.wordBank![0]).toEqual({ id: q.wordSlots![0].correctWordId, label: "M" });
  });

  it("patchBlank writes the sentence and patches only the blank with that id", () => {
    const edited = { ...S, text: TEXT.replace("SUM", "MAX"), blanks: S.blanks };
    const fillOut = patchBlank(writeBlankSentence(fill, S), edited, "b1", { correctAnswers: ["AVERAGE", "TB"] });
    expect(fillOut.textBlanks!.map((b) => b.correctAnswers)).toEqual([["AVERAGE", "TB"], ["MAX"]]);
    const selectOut = patchBlank(writeBlankSentence(select, S), edited, "b2", { options: ["MAX", "MIN"] });
    expect(selectOut.inlineBlanks!.map((b) => b.options)).toEqual([["AVERAGE"], ["MAX", "MIN"]]);
  });

  it("renames the correct option when the word is new", () => {
    const out = writeBlankSentence(oldSelect, setBlankText(readBlankSentence(oldSelect), "i1", "có"));
    expect(out.inlineBlanks![0].options).toEqual(["có", "no"]);
  });

  it("keeps a drag distractor", () => {
    const out = writeBlankSentence(drag, S);
    const withDistractor = { ...out, wordBank: [...out.wordBank!, { id: "d1", label: "màu" }] };
    expect(writeBlankSentence(withDistractor, S).wordBank).toContainEqual({ id: "d1", label: "màu" });
  });

  it("drops a distractor whose word becomes a blank, and keeps others when blanks change", () => {
    const out = writeBlankSentence(drag, S);
    const words = out.wordBank!.map((w) => w.label);
    const withDistractors = { ...out, wordBank: [...out.wordBank!, { id: "d1", label: words[0] }, { id: "d2", label: "màu" }] };
    const bank = writeBlankSentence(withDistractors, S).wordBank!;
    expect(bank.filter((w) => w.label === words[0])).toHaveLength(1);
    expect(bank).toContainEqual({ id: "d2", label: "màu" });
    expect(writeBlankSentence(withDistractors, { ...S, blanks: [] }).wordBank).toContainEqual({ id: "d2", label: "màu" });
  });

  it("gives two slots that share a word distinct word ids", () => {
    const shared: Question = {
      ...drag,
      wordSlots: [
        { id: "s1", label: "A", correctWordId: "w1" },
        { id: "s2", label: "B", correctWordId: "w1" },
      ],
      wordBank: [{ id: "w1", label: "x" }],
    };
    const ids = writeBlankSentence(shared, readBlankSentence(shared)).wordSlots!.map((slot) => slot.correctWordId);
    expect(new Set(ids).size).toBe(2);
  });

  it("gives a new slot a fresh word id when its default id is taken", () => {
    const taken: Question = {
      ...drag,
      wordSlots: [{ id: "b1", label: "", correctWordId: "b2-word" }],
      wordBank: [{ id: "b2-word", label: "AVERAGE" }],
    };
    const ids = writeBlankSentence(taken, S).wordSlots!.map((slot) => slot.correctWordId);
    expect(ids[0]).toBe("b2-word");
    expect(new Set(ids).size).toBe(2);
  });

  it("keeps punctuation tight against the word", () => {
    const old: Question = { ...fill, textBlanks: [{ id: "t1", label: "", prefix: "Thủ đô là", correctAnswers: ["Hà Nội"], suffix: "." }] };
    expect(readBlankSentence(old).text).toBe("Thủ đô là Hà Nội.");
    const quoted: Question = { ...fill, textBlanks: [{ id: "t1", label: "", prefix: "Gọi là (", correctAnswers: ["SUM"], suffix: ")," }] };
    expect(readBlankSentence(quoted).text).toBe("Gọi là (SUM),");
  });

  it("keeps the text around a whitespace-only word but drops its blank", () => {
    const old: Question = { ...fill, textBlanks: [{ id: "t1", label: "", prefix: "A", correctAnswers: ["  "], suffix: "B" }] };
    expect(readBlankSentence(old)).toEqual({ text: "A B", blanks: [] });
  });

  it("reads inline_choice and writes it as select_from_lists", () => {
    const inline: Question = {
      ...base,
      kind: "inline_choice",
      inlineBlanks: [{ id: "i1", statement: "Màu trời là", selectPosition: "after", options: ["xanh", "đỏ"], correctOptionId: "xanh", suffix: "." }],
    };
    const read = readBlankSentence(inline);
    expect(read.text).toBe("Màu trời là xanh.");
    const out = writeBlankSentence(inline, read);
    expect(out.kind).toBe("select_from_lists");
    expect(out.inlineBlanks![0].options).toEqual(["xanh", "đỏ"]);
    expect(readBlankSentence(out)).toEqual(read);
  });
});
