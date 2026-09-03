export type VerseWord = {
  wordIndex: number;
  strongs: string;
  englishGloss: string;
  lemma: string | null;
  transliteration: string | null;
  morphology: string | null;
};

export type AlignedToken = {
  text: string;
  leadingSpace: boolean;
  strongs?: string;
  wordIndex?: number;
  isHoverable: boolean;
};

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, "");
}

function glossTokens(gloss: string): string[] {
  return gloss
    .replace(/[[\]<>]/g, " ")
    .split(/[\s/]+/)
    .map(normalizeWord)
    .filter((w) => w.length > 0 && w !== "obj" && w !== "the" && w !== "a" && w !== "an");
}

function glossMatchesToken(gloss: string, token: string): boolean {
  const t = normalizeWord(token);
  if (!t) return false;

  const g = normalizeWord(gloss);
  if (g && (g === t || t.startsWith(g) || g.startsWith(t))) return true;

  const words = glossTokens(gloss);
  return words.some((gw) => gw === t || (gw.length > 2 && (t.startsWith(gw) || gw.startsWith(t))));
}

/**
 * Best-effort map of WEB English tokens to Strong's-tagged glosses.
 * Concordance chips should use verse_words directly; this is for in-text highlights.
 */
export function alignVerseWords(verseText: string, verseWords: VerseWord[]): AlignedToken[] {
  if (verseWords.length === 0) {
    return [{ text: verseText, leadingSpace: false, isHoverable: false }];
  }

  const tokenRegex = /(\s*)([^\s]+)/g;
  const tokens: { text: string; leadingSpace: boolean; index: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(verseText)) !== null) {
    tokens.push({
      leadingSpace: match[1].length > 0,
      text: match[2],
      index: tokens.length,
    });
  }

  const used = new Set<number>();
  const strongsByToken = new Map<number, { strongs: string; wordIndex: number }>();
  const sortedWords = [...verseWords].sort((a, b) => a.wordIndex - b.wordIndex);

  // Prefer sequential alignment: search forward from the last matched token.
  let searchFrom = 0;
  for (const vw of sortedWords) {
    let matched = false;

    for (let i = searchFrom; i < tokens.length; i++) {
      if (used.has(i)) continue;
      if (glossMatchesToken(vw.englishGloss, tokens[i].text)) {
        used.add(i);
        strongsByToken.set(i, { strongs: vw.strongs, wordIndex: vw.wordIndex });
        searchFrom = i + 1;
        matched = true;
        break;
      }
    }

    if (!matched) {
      for (let i = 0; i < searchFrom; i++) {
        if (used.has(i)) continue;
        if (glossMatchesToken(vw.englishGloss, tokens[i].text)) {
          used.add(i);
          strongsByToken.set(i, { strongs: vw.strongs, wordIndex: vw.wordIndex });
          break;
        }
      }
    }
  }

  return tokens.map((token) => {
    const mapping = strongsByToken.get(token.index);
    return {
      text: token.text,
      leadingSpace: token.leadingSpace,
      strongs: mapping?.strongs,
      wordIndex: mapping?.wordIndex,
      isHoverable: Boolean(mapping?.strongs),
    };
  });
}

export function parseRootStrongs(definition: string): string | null {
  const match = definition.match(/\bFrom\s+([GH]\d+)\b/i);
  return match ? match[1].toUpperCase() : null;
}

export function morphologyLabel(morphology: string | null): string {
  if (!morphology) return "";
  const map: Record<string, string> = {
    N: "Noun",
    V: "Verb",
    A: "Adjective",
    ADV: "Adverb",
    CONJ: "Conjunction",
    PREP: "Preposition",
    PRT: "Particle",
    "PRT-N": "Particle",
    HR: "Hebrew particle/preposition",
    HC: "Conjunction",
    HTd: "Article",
    HNcfsa: "Noun",
    HVqp3ms: "Verb",
  };
  const parts = morphology.split(/[-\/]/);
  const pos = map[parts[0]] ?? parts[0];
  const details = parts.slice(1).join(", ");
  return details ? `${pos}, ${details}` : pos;
}
