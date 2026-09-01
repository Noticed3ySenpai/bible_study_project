export type BibleBook = {
  id: number;
  osis: string;
  name: string;
  testament: "OT" | "NT";
  chapters: number;
};

export const BIBLE_BOOKS: BibleBook[] = [
  { id: 1, osis: "Gen", name: "Genesis", testament: "OT", chapters: 50 },
  { id: 2, osis: "Exod", name: "Exodus", testament: "OT", chapters: 40 },
  { id: 3, osis: "Lev", name: "Leviticus", testament: "OT", chapters: 27 },
  { id: 4, osis: "Num", name: "Numbers", testament: "OT", chapters: 36 },
  { id: 5, osis: "Deut", name: "Deuteronomy", testament: "OT", chapters: 34 },
  { id: 6, osis: "Josh", name: "Joshua", testament: "OT", chapters: 24 },
  { id: 7, osis: "Judg", name: "Judges", testament: "OT", chapters: 21 },
  { id: 8, osis: "Ruth", name: "Ruth", testament: "OT", chapters: 4 },
  { id: 9, osis: "1Sam", name: "1 Samuel", testament: "OT", chapters: 31 },
  { id: 10, osis: "2Sam", name: "2 Samuel", testament: "OT", chapters: 24 },
  { id: 11, osis: "1Kgs", name: "1 Kings", testament: "OT", chapters: 22 },
  { id: 12, osis: "2Kgs", name: "2 Kings", testament: "OT", chapters: 25 },
  { id: 13, osis: "1Chr", name: "1 Chronicles", testament: "OT", chapters: 29 },
  { id: 14, osis: "2Chr", name: "2 Chronicles", testament: "OT", chapters: 36 },
  { id: 15, osis: "Ezra", name: "Ezra", testament: "OT", chapters: 10 },
  { id: 16, osis: "Neh", name: "Nehemiah", testament: "OT", chapters: 13 },
  { id: 17, osis: "Esth", name: "Esther", testament: "OT", chapters: 10 },
  { id: 18, osis: "Job", name: "Job", testament: "OT", chapters: 42 },
  { id: 19, osis: "Ps", name: "Psalms", testament: "OT", chapters: 150 },
  { id: 20, osis: "Prov", name: "Proverbs", testament: "OT", chapters: 31 },
  { id: 21, osis: "Eccl", name: "Ecclesiastes", testament: "OT", chapters: 12 },
  { id: 22, osis: "Song", name: "Song of Solomon", testament: "OT", chapters: 8 },
  { id: 23, osis: "Isa", name: "Isaiah", testament: "OT", chapters: 66 },
  { id: 24, osis: "Jer", name: "Jeremiah", testament: "OT", chapters: 52 },
  { id: 25, osis: "Lam", name: "Lamentations", testament: "OT", chapters: 5 },
  { id: 26, osis: "Ezek", name: "Ezekiel", testament: "OT", chapters: 48 },
  { id: 27, osis: "Dan", name: "Daniel", testament: "OT", chapters: 12 },
  { id: 28, osis: "Hos", name: "Hosea", testament: "OT", chapters: 14 },
  { id: 29, osis: "Joel", name: "Joel", testament: "OT", chapters: 3 },
  { id: 30, osis: "Amos", name: "Amos", testament: "OT", chapters: 9 },
  { id: 31, osis: "Obad", name: "Obadiah", testament: "OT", chapters: 1 },
  { id: 32, osis: "Jonah", name: "Jonah", testament: "OT", chapters: 4 },
  { id: 33, osis: "Mic", name: "Micah", testament: "OT", chapters: 7 },
  { id: 34, osis: "Nah", name: "Nahum", testament: "OT", chapters: 3 },
  { id: 35, osis: "Hab", name: "Habakkuk", testament: "OT", chapters: 3 },
  { id: 36, osis: "Zeph", name: "Zephaniah", testament: "OT", chapters: 3 },
  { id: 37, osis: "Hag", name: "Haggai", testament: "OT", chapters: 2 },
  { id: 38, osis: "Zech", name: "Zechariah", testament: "OT", chapters: 14 },
  { id: 39, osis: "Mal", name: "Malachi", testament: "OT", chapters: 4 },
  { id: 40, osis: "Matt", name: "Matthew", testament: "NT", chapters: 28 },
  { id: 41, osis: "Mark", name: "Mark", testament: "NT", chapters: 16 },
  { id: 42, osis: "Luke", name: "Luke", testament: "NT", chapters: 24 },
  { id: 43, osis: "John", name: "John", testament: "NT", chapters: 21 },
  { id: 44, osis: "Acts", name: "Acts", testament: "NT", chapters: 28 },
  { id: 45, osis: "Rom", name: "Romans", testament: "NT", chapters: 16 },
  { id: 46, osis: "1Cor", name: "1 Corinthians", testament: "NT", chapters: 16 },
  { id: 47, osis: "2Cor", name: "2 Corinthians", testament: "NT", chapters: 13 },
  { id: 48, osis: "Gal", name: "Galatians", testament: "NT", chapters: 6 },
  { id: 49, osis: "Eph", name: "Ephesians", testament: "NT", chapters: 6 },
  { id: 50, osis: "Phil", name: "Philippians", testament: "NT", chapters: 4 },
  { id: 51, osis: "Col", name: "Colossians", testament: "NT", chapters: 4 },
  { id: 52, osis: "1Thess", name: "1 Thessalonians", testament: "NT", chapters: 5 },
  { id: 53, osis: "2Thess", name: "2 Thessalonians", testament: "NT", chapters: 3 },
  { id: 54, osis: "1Tim", name: "1 Timothy", testament: "NT", chapters: 6 },
  { id: 55, osis: "2Tim", name: "2 Timothy", testament: "NT", chapters: 4 },
  { id: 56, osis: "Titus", name: "Titus", testament: "NT", chapters: 3 },
  { id: 57, osis: "Phlm", name: "Philemon", testament: "NT", chapters: 1 },
  { id: 58, osis: "Heb", name: "Hebrews", testament: "NT", chapters: 13 },
  { id: 59, osis: "Jas", name: "James", testament: "NT", chapters: 5 },
  { id: 60, osis: "1Pet", name: "1 Peter", testament: "NT", chapters: 5 },
  { id: 61, osis: "2Pet", name: "2 Peter", testament: "NT", chapters: 3 },
  { id: 62, osis: "1John", name: "1 John", testament: "NT", chapters: 5 },
  { id: 63, osis: "2John", name: "2 John", testament: "NT", chapters: 1 },
  { id: 64, osis: "3John", name: "3 John", testament: "NT", chapters: 1 },
  { id: 65, osis: "Jude", name: "Jude", testament: "NT", chapters: 1 },
  { id: 66, osis: "Rev", name: "Revelation", testament: "NT", chapters: 22 },
];

export const BOOK_BY_OSIS = Object.fromEntries(
  BIBLE_BOOKS.map((b) => [b.osis, b])
) as Record<string, BibleBook>;

export const BOOK_BY_ID = Object.fromEntries(
  BIBLE_BOOKS.map((b) => [b.id, b])
) as Record<number, BibleBook>;

export function slugifyBook(osis: string): string {
  return osis.toLowerCase();
}

export function bookFromSlug(slug: string): BibleBook | undefined {
  return BIBLE_BOOKS.find((b) => slugifyBook(b.osis) === slug.toLowerCase());
}
