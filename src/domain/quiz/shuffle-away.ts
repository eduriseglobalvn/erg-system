/** A fixed shuffle of `ids` for `seed`; never equal to `avoid` when ids.length ≥ 2. Pure, no Math.random. */
export function shuffleAway(ids: string[], avoid: string[], seed: string): string[] {
  // FNV-1a 32-bit hash of the seed feeds a mulberry32 PRNG.
  let state = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    state = Math.imul(state ^ seed.charCodeAt(index), 0x01000193) >>> 0;
  }
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const result = [...ids];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  const same = result.length === avoid.length && result.every((id, index) => id === avoid[index]);
  // With distinct ids a left rotation never equals the original order.
  return same && result.length > 1 ? [...result.slice(1), result[0]] : result;
}
