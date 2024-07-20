export interface Bookmark {
  book: number;
  bookName?: string;
  chapter: number;
  verses: number[];
  displayText: string;
}

export interface RecentRead {
  book: number;
  bookName?: string;
  chapter: number;
}

export interface Verse {
  id: number;
  book_name: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}
