export interface Book {
  /** 1-66 */
  bookNumber: number;
  /** `Genesis`, `Exodus` etc */
  name: string;
  chapters: number;
  /** `Gen`, `Exo` etc */
  // abbreviation: string;
  /** `GEN`, `EXO` etc */
  usfm: string;
  /** `ot` or `nt` */
  canon: 'ot' | 'nt';
  /** `KJV`, `NB` etc */
  translation: string;
}

export interface VerseTarget {
  translation: string;
  bookNumber: number;
  bookUsfm: string;
  bookName: string;
  chapter: number;
  verse: number;
  startOffset?: number;
  endOffset?: number;
  quote?: string;
  textBefore?: string;
  textAfter?: string;
}

export interface VerseSelection {
  targets: VerseTarget[];
  highlightId?: number;
}

interface AnnotationBase {
  id: number;
  targets: VerseTarget[];
  createdAt: string;
  updatedAt: string;
}

export interface HighlightAnnotation extends AnnotationBase {
  type: 'highlight';
  color: string;
}

export interface NoteAnnotation extends AnnotationBase {
  type: 'note';
  content: string;
}

export interface BookmarkAnnotation extends AnnotationBase {
  type: 'bookmark';
}

export interface TagDefinition {
  id: number;
  name: string;
  slug: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagAnnotation extends AnnotationBase {
  type: 'tag';
  tagIds: number[];
}

export type Annotation =
  | HighlightAnnotation
  | NoteAnnotation
  | BookmarkAnnotation
  | TagAnnotation;

export interface RecentRead {
  bookUsfm: string;
  bookName?: string;
  chapter: number;
  translation: string;
}

export interface Verse {
  id: number;
  /** `Genesis`, `Exodus` etc */
  bookName: string;
  /** 1-66 */
  bookNumber: number;
  /** `GEN`, `EXO` etc */
  bookUsfm: string;
  canon: string;
  chapter: number;
  verse: number;
  text: string;
  /** `KJV`, `NB` etc */
  translation: string;
}

/** Enriched search row for Bible text and study-data matches. */
export type SearchHitSource = 'verse' | 'note' | 'tag';

export interface SearchHit extends Verse {
  source: SearchHitSource;
  /** Tag name shown as a chip */
  matchLabel?: string;
  /** Note body when source is note (verse text stays in `text`) */
  noteContent?: string;
}

export interface AnnotatedVerse extends Verse {
  highlights: HighlightAnnotation[];
  notes: NoteAnnotation[];
  tags: TagDefinition[];
}
