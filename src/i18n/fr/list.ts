/** Names in a sentence: « a, b et c ». */
export const listFr = (names: readonly string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names.at(-1)}` : (names[0] ?? '')
