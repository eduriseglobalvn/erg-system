import type { InlineBlank, Question, TextBlank } from "@/domain/quiz/types";
import { blankWord, sentenceParts, setBlankText, type BlankSentence, type SentenceBlank } from "./blank-sentence";

// For fill_blank, select_from_lists, inline_choice and drag_words questions.

type StoredBlank = { id: string; before: string; word: string; after: string };
type EditedBlank = { id: string; word: string; lead: string; suffix: string };

const isSelect = (question: Question) => question.kind === "select_from_lists" || question.kind === "inline_choice";

function storedBlanks(question: Question): StoredBlank[] {
  if (question.kind === "drag_words") {
    const bank = question.wordBank ?? [];
    return (question.wordSlots ?? []).map((slot) => ({
      id: slot.id,
      before: slot.label,
      word: bank.find((word) => word.id === slot.correctWordId)?.label ?? "",
      after: slot.suffix ?? "",
    }));
  }
  if (isSelect(question)) {
    return (question.inlineBlanks ?? []).map((blank) =>
      blank.selectPosition === "after"
        ? { id: blank.id, before: blank.statement, word: blank.correctOptionId, after: blank.suffix ?? "" }
        : { id: blank.id, before: "", word: blank.correctOptionId, after: blank.statement },
    );
  }
  return (question.textBlanks ?? []).map((blank) => ({
    id: blank.id,
    before: blank.prefix ?? "",
    word: blank.correctAnswers[0] ?? "",
    after: blank.suffix ?? "",
  }));
}

export function readBlankSentence(question: Question): BlankSentence {
  const all = storedBlanks(question);
  const parts = question.sentenceParts;
  const blanks: SentenceBlank[] = [];
  // A blank the teacher just emptied is written with word "", so it is kept here; old data skips empty words.
  if (parts?.length === all.length + 1) {
    let text = parts[0];
    all.forEach((blank, i) => {
      blanks.push({ id: blank.id, start: text.length, end: text.length + blank.word.length });
      text += blank.word + parts[i + 1];
    });
    return { text, blanks };
  }
  if (!all.length) return { text: parts?.[0] ?? "", blanks };
  // Old data stores loose pieces; join them with one space, kept off punctuation and brackets.
  let text = "";
  const append = (piece: string) => {
    if (!piece) return;
    if (text && !/[\s(“]$/.test(text) && !/^[\s.,;:!?)…”]/.test(piece)) text += " ";
    text += piece;
  };
  for (const blank of all) {
    append(blank.before);
    if (blank.word.trim()) {
      append(blank.word);
      blanks.push({ id: blank.id, start: text.length - blank.word.length, end: text.length });
    }
    append(blank.after);
  }
  return { text, blanks };
}

// The correct option is tracked by position, so typing past another option's text never renames that option.
function selectOptions(old: InlineBlank | undefined, word: string): string[] {
  if (!old) return [word];
  const idx = old.options.indexOf(old.correctOptionId);
  return idx >= 0 ? old.options.map((option, i) => (i === idx ? word : option)) : [word, ...old.options];
}

/** Makes `option` the blank's correct answer (and its word in the sentence) without touching the options. */
export function selectBlankOption(question: Question, blankId: string, option: string): Question {
  const next = writeBlankSentence(question, setBlankText(readBlankSentence(question), blankId, option));
  const options = question.inlineBlanks?.find((blank) => blank.id === blankId)?.options;
  return {
    ...next,
    inlineBlanks: next.inlineBlanks?.map((blank) => (blank.id === blankId && options ? { ...blank, options } : blank)),
  };
}

function writeDrag(question: Question, edited: EditedBlank[]): Pick<Question, "wordSlots" | "wordBank"> {
  const oldSlots = question.wordSlots ?? [];
  const used = new Set<string>();
  const wordSlots = edited.map(({ id, lead, suffix }) => {
    const old = oldSlots.find((slot) => slot.id === id);
    let correctWordId = old?.correctWordId && !used.has(old.correctWordId) ? old.correctWordId : `${id}-word`;
    for (let k = 2; used.has(correctWordId); k++) correctWordId = `${id}-word-${k}`;
    used.add(correctWordId);
    return { ...old, id, label: lead, suffix, correctWordId };
  });
  const referenced = new Set([...used, ...oldSlots.map((slot) => slot.correctWordId)]);
  // A distractor that became a blank's word would show twice in the learner's tray.
  const slotWords = new Set(edited.map(({ word }) => word.trim()));
  const distractors = (question.wordBank ?? []).filter((word) => !referenced.has(word.id) && !slotWords.has(word.label.trim()));
  return {
    wordSlots,
    wordBank: [...wordSlots.map((slot, i) => ({ id: slot.correctWordId, label: edited[i].word })), ...distractors],
  };
}

export function writeBlankSentence(question: Question, sentence: BlankSentence): Question {
  const parts = sentenceParts(sentence);
  const n = sentence.blanks.length;
  const tail = parts[n].trim();
  const edited: EditedBlank[] = sentence.blanks.map((blank, i) => ({
    id: blank.id,
    word: blankWord(sentence, blank),
    lead: parts[i].trim(),
    suffix: i === n - 1 ? tail : "",
  }));
  const out: Question = { ...question, sentenceParts: parts };
  if (question.kind === "drag_words") return { ...out, ...writeDrag(question, edited) };
  if (isSelect(question)) {
    const inlineBlanks = edited.map(({ id, word, lead, suffix }): InlineBlank => {
      const old = question.inlineBlanks?.find((blank) => blank.id === id);
      return { ...old, id, statement: lead, selectPosition: "after", suffix, correctOptionId: word, options: selectOptions(old, word) };
    });
    return { ...out, kind: "select_from_lists", inlineBlanks };
  }
  const textBlanks = edited.map(({ id, word, lead, suffix }): TextBlank => {
    const old = question.textBlanks?.find((blank) => blank.id === id);
    return { ...old, id, label: old?.label ?? "", prefix: lead, suffix, correctAnswers: [word, ...(old?.correctAnswers.slice(1) ?? [])] };
  });
  return { ...out, textBlanks };
}
