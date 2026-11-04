export async function handleClipboardCommand(command: "cut" | "copy" | "paste") {
  const editable = getActiveEditableElement();

  if (editable) {
    const start = editable.selectionStart ?? 0;
    const end = editable.selectionEnd ?? start;

    if (command === "paste") {
      const text = await navigator.clipboard?.readText().catch(() => "") || localTextClipboard;
      if (text) {
        replaceEditableSelection(editable, text, start, end);
        return;
      }
    }

    const selectedText = editable.value.slice(start, end);
    if (selectedText) {
      localTextClipboard = selectedText;
      await navigator.clipboard?.writeText(selectedText).catch(() => undefined);

      if (command === "cut") {
        replaceEditableSelection(editable, "", start, end);
      }

      return;
    }
  }

  document.execCommand(command);
}

let localTextClipboard = "";

function getActiveEditableElement() {
  const element = document.activeElement;
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element;
  }

  return null;
}

function replaceEditableSelection(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  start: number,
  end: number,
) {
  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  const nextValue = `${element.value.slice(0, start)}${text}${element.value.slice(end)}`;

  valueSetter?.call(element, nextValue);
  element.selectionStart = start + text.length;
  element.selectionEnd = start + text.length;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}