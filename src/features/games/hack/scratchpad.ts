/** Scratchpad for numeric questions: evaluates "2 × 1 024 ÷ 250" with + - × ÷ * / ( ) and "," or "." decimals. Returns null when it is not a clean expression. */
export function evalScratch(input: string): number | null {
  const text = input.replace(/\s+/g, "").replace(/,/g, ".").replace(/×/g, "*").replace(/÷/g, "/");
  if (!text || !/^[\d.+\-*/()]+$/.test(text)) return null;
  let pos = 0;
  const peek = () => text[pos];
  function number(): number {
    if (peek() === "(") {
      pos += 1;
      const inner = sum();
      if (peek() !== ")") throw new Error("paren");
      pos += 1;
      return inner;
    }
    if (peek() === "-") {
      pos += 1;
      return -number();
    }
    const match = /^\d+(\.\d+)?/.exec(text.slice(pos));
    if (!match) throw new Error("number");
    pos += match[0].length;
    return Number(match[0]);
  }
  function product(): number {
    let value = number();
    while (peek() === "*" || peek() === "/") {
      const op = text[pos++];
      const rhs = number();
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (peek() === "+" || peek() === "-") {
      const op = text[pos++];
      const rhs = product();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }
  try {
    const value = sum();
    return pos === text.length && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** "8,19": two decimals at most, comma as the decimal mark. */
export function formatScratch(value: number): string {
  return String(Math.round(value * 100) / 100).replace(".", ",");
}
