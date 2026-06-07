export function displayText(value?: string) {
  if (!value) return "";

  if (!/[\u00c3\u00c4\u00c2\u00ba\u00bb\u00bc\u00bd\u00be\u0080-\u009f]/.test(value)) {
    return value;
  }

  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(
      Uint8Array.from(Array.from(value, (character) => character.charCodeAt(0) & 0xff)),
    );
  } catch {
    return value;
  }
}

export function validateLibraryLoginEmail(value: string) {
  if (!value.trim()) return "Email is required.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : "Email is invalid.";
}
