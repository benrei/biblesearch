import { computed, inject, Injectable, linkedSignal, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { QueryParam } from 'src/app/constants/query-param';
import { SearchHit, SearchHitSource, Verse } from 'src/app/interfaces';
import { AnnotationService } from 'src/app/services/annotation.service';
import { ApiService, SearchReqParams } from 'src/app/services/api.service';
import { BibleTranslationService } from 'src/app/services/bible-translation.service';

const SEARCH = 'search';
const QUERY = 'query';
const SORT = 'sort';
const PAGE = 'page';
const TAG = QueryParam.Tag;
const BOOK = QueryParam.Book;
const HAS = QueryParam.Has;

export type AnnotationHasFilter = 'highlight' | 'note' | 'tag' | 'bookmark' | '';

export interface AppSearchResponse {
  count: number;
  verses: SearchHit[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private bibleTranslation = inject(BibleTranslationService);
  private annotations = inject(AnnotationService);

  queryParams = toSignal(this.activatedRoute.queryParams);
  isSearchOpen = computed(() => this.queryParams()?.[SEARCH] === 'open');
  searchTerm = computed(() => this.queryParams()?.[QUERY] || '');
  selectedTagSlug = computed(() => {
    const tag = this.queryParams()?.[TAG];
    return typeof tag === 'string' ? tag : '';
  });
  selectedBook = computed(() => {
    const book = this.queryParams()?.[BOOK];
    return typeof book === 'string' ? book : '';
  });
  selectedHas = computed(() => {
    const has = this.queryParams()?.[HAS];
    return (typeof has === 'string' ? has : '') as AnnotationHasFilter;
  });
  sortOrder = computed(
    () => (this.queryParams()?.[SORT] as 'relevance' | 'chronological') || 'chronological',
  );
  page = computed(() => Math.max(1, Math.floor(Number(this.queryParams()?.[PAGE]) || 1)));
  private searchParams = computed<SearchReqParams>(() => ({
    ...(this.queryParams() as SearchReqParams),
    page: this.page(),
    books: this.selectedBook() || undefined,
    translations: this.bibleTranslation.translation() || 'KJV',
  }));

  books = resource({
    params: () => this.bibleTranslation.translation() || 'KJV',
    loader: ({ params }) => this.apiService.getBooks(params),
    defaultValue: [],
  });

  warmup(): void {
    const translation = this.bibleTranslation.translation();
    if (translation) {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(() => void this.apiService.getBooks(translation));
      } else {
        setTimeout(() => void this.apiService.getBooks(translation), 50);
      }
    }
  }

  searchResults = resource<
    AppSearchResponse,
    SearchReqParams & { tagSlug: string; has: AnnotationHasFilter }
  >({
    params: computed(() => ({
      ...this.searchParams(),
      tagSlug: this.selectedTagSlug(),
      has: this.selectedHas(),
    })),
    loader: async ({ params }) => {
      const trimmedQuery = params.query?.trim() || '';
      const tagSlug = params.tagSlug;
      const has = params.has;
      const taggedVerses = tagSlug ? this.getTaggedVerses(tagSlug) : [];
      const annotatedVerses = has ? this.getAnnotatedVerses(has) : [];

      if (trimmedQuery.length < 2) {
        if (tagSlug) return { verses: taggedVerses, count: taggedVerses.length };
        if (has) return { verses: annotatedVerses, count: annotatedVerses.length };
        return { verses: [], count: 0 };
      }

      const bibleResults = await this.apiService.search({ ...params, query: trimmedQuery });
      let hits = asVerseHits(bibleResults.verses);

      if (tagSlug) {
        const taggedKeys = new Set(taggedVerses.map(verseKey));
        hits = hits.filter((verse) => taggedKeys.has(verseKey(verse)));
      }

      if (has) {
        const annotatedKeys = new Set(annotatedVerses.map(verseKey));
        hits = hits.filter((verse) => annotatedKeys.has(verseKey(verse)));
      }

      const baseCount = !tagSlug && !has ? bibleResults.count : hits.length;
      let results: AppSearchResponse = { verses: hits, count: baseCount };

      // Include local study-data matches (notes + tags) on the first page.
      if (params.page === 1 || !params.page) {
        const studyVerses = await this.searchStudyData(trimmedQuery, {
          bookUsfm: params.books,
          has,
          tagSlug,
        });
        results = mergeUniqueHits(studyVerses, results);
      }

      return results;
    },
  });

  visibleSearchResults = linkedSignal<
    { page: number; results: AppSearchResponse | undefined },
    AppSearchResponse | undefined
  >({
    source: computed(() => ({ page: this.page(), results: this.searchResults.value() })),
    computation: ({ page, results }, previous) =>
      results ?? (page > 1 ? previous?.value : undefined),
  });

  togglePopover(open: boolean) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { [SEARCH]: open ? 'open' : null },
      queryParamsHandling: 'merge',
    });
  }

  updateSearchQueryParam(value: string): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { [QUERY]: value || null, [PAGE]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  updateSortOrder(value: 'relevance' | 'chronological'): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { [SORT]: value === 'chronological' ? null : value, [PAGE]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  updateTagFilter(slug: string | null): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { [TAG]: slug || null, [PAGE]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  updateBookFilter(bookUsfm: string | null): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { [BOOK]: bookUsfm || null, [PAGE]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  updateHasFilter(has: AnnotationHasFilter | null): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { [HAS]: has || null, [PAGE]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  loadNextPage(): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { [PAGE]: this.page() + 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private getAnnotatedVerses(has: Exclude<AnnotationHasFilter, ''>): SearchHit[] {
    const source: SearchHitSource =
      has === 'note' ? 'note' : has === 'tag' ? 'tag' : 'verse';
    const translation = this.bibleTranslation.translation() || 'KJV';
    const list =
      has === 'highlight'
        ? this.annotations.highlights()
        : has === 'note'
          ? this.annotations.notes()
          : has === 'bookmark'
            ? this.annotations.bookmarks()
            : this.annotations.tagAnnotations();

    const verses: SearchHit[] = [];
    const seen = new Set<string>();
    for (const annotation of list) {
      for (const target of annotation.targets) {
        if (target.translation !== translation) continue;
        const key = verseKey(target);
        if (seen.has(key)) continue;
        seen.add(key);
        const text =
          annotation.type === 'note'
            ? target.quote || ''
            : target.quote || '';
        verses.push({
          id: annotation.id * 1000 + target.verse,
          bookName: target.bookName,
          bookNumber: target.bookNumber,
          bookUsfm: target.bookUsfm,
          canon: '',
          chapter: target.chapter,
          verse: target.verse,
          text,
          translation: target.translation,
          source,
          noteContent: annotation.type === 'note' ? annotation.content : undefined,
        });
      }
    }
    return verses.sort(
      (a, b) => a.bookNumber - b.bookNumber || a.chapter - b.chapter || a.verse - b.verse,
    );
  }

  private getTaggedVerses(slug: string): SearchHit[] {
    const tag = this.annotations.findTagBySlug(slug);
    if (!tag) return [];

    const translation = this.bibleTranslation.translation() || 'KJV';
    const verses: SearchHit[] = [];
    const seen = new Set<string>();

    for (const annotation of this.annotations.getAnnotationsForTag(tag.id)) {
      for (const target of annotation.targets) {
        if (target.translation !== translation) continue;
        const key = verseKey(target);
        if (seen.has(key)) continue;
        seen.add(key);
        verses.push({
          id: annotation.id * 1000 + target.verse,
          bookName: target.bookName,
          bookNumber: target.bookNumber,
          bookUsfm: target.bookUsfm,
          canon: '',
          chapter: target.chapter,
          verse: target.verse,
          text: target.quote || '',
          translation: target.translation,
          source: 'tag',
          matchLabel: tag.name,
        });
      }
    }

    return verses.sort(
      (a, b) => a.bookNumber - b.bookNumber || a.chapter - b.chapter || a.verse - b.verse,
    );
  }

  private async searchStudyData(
    query: string,
    options: { bookUsfm?: string; has: AnnotationHasFilter; tagSlug: string },
  ): Promise<SearchHit[]> {
    const q = query.toLowerCase();
    const translation = this.bibleTranslation.translation() || 'KJV';
    const bookUsfm = options.bookUsfm?.split(',')[0]?.trim() || '';
    const verses: SearchHit[] = [];
    const seen = new Set<string>();

    const pushTarget = (
      target: {
        translation: string;
        bookName: string;
        bookNumber: number;
        bookUsfm: string;
        chapter: number;
        verse: number;
        quote?: string;
      },
      id: number,
      hitOptions: {
        source: SearchHitSource;
        text: string;
        matchLabel?: string;
        noteContent?: string;
      },
    ) => {
      if (target.translation !== translation) return;
      if (bookUsfm && target.bookUsfm !== bookUsfm) return;
      const key = `${hitOptions.source}|${verseKey(target)}`;
      if (seen.has(key)) return;
      seen.add(key);
      verses.push({
        id,
        bookName: target.bookName,
        bookNumber: target.bookNumber,
        bookUsfm: target.bookUsfm,
        canon: '',
        chapter: target.chapter,
        verse: target.verse,
        text: hitOptions.text,
        translation: target.translation,
        source: hitOptions.source,
        matchLabel: hitOptions.matchLabel,
        noteContent: hitOptions.noteContent,
      });
    };

    const includeNotes = !options.has || options.has === 'note';
    const includeTags = !options.has || options.has === 'tag';

    if (includeNotes) {
      for (const note of this.annotations.notes()) {
        if (!note.content?.toLowerCase().includes(q)) continue;
        for (const target of note.targets) {
          pushTarget(target, note.id * 1000 + target.verse, {
            source: 'note',
            text: target.quote || '',
            noteContent: note.content,
          });
        }
      }
    }

    if (includeTags) {
      for (const tag of this.annotations.tagDefinitions()) {
        if (options.tagSlug && tag.slug !== options.tagSlug) continue;
        if (!tag.name.toLowerCase().includes(q) && !tag.slug.includes(q)) continue;
        for (const annotation of this.annotations.getAnnotationsForTag(tag.id)) {
          for (const target of annotation.targets) {
            pushTarget(target, annotation.id * 1000 + target.verse, {
              source: 'tag',
              text: target.quote || '',
              matchLabel: tag.name,
            });
          }
        }
      }
    }

    await this.fillMissingVerseText(verses);

    return verses.sort(
      (a, b) => a.bookNumber - b.bookNumber || a.chapter - b.chapter || a.verse - b.verse,
    );
  }

  private async fillMissingVerseText(hits: SearchHit[]): Promise<void> {
    const missing = hits.filter((hit) => !hit.text?.trim());
    if (!missing.length) return;

    const chapters = new Map<string, SearchHit[]>();
    for (const hit of missing) {
      const key = `${hit.translation}|${hit.bookUsfm}|${hit.chapter}`;
      const list = chapters.get(key) ?? [];
      list.push(hit);
      chapters.set(key, list);
    }

    await Promise.all(
      [...chapters.entries()].map(async ([key, chapterHits]) => {
        const [translation, bookUsfm, chapter] = key.split('|');
        try {
          const verses = await this.apiService.getVerses(translation, bookUsfm, Number(chapter));
          const byNumber = new Map(verses.map((verse) => [verse.verse, verse.text]));
          for (const hit of chapterHits) {
            hit.text = byNumber.get(hit.verse) || hit.text;
          }
        } catch {
          // Ignore fetch errors; keep empty verse text.
        }
      }),
    );
  }
}

function asVerseHits(verses: Verse[]): SearchHit[] {
  return verses.map((verse) => ({ ...verse, source: 'verse' as const }));
}

function verseKey(verse: Pick<Verse, 'bookUsfm' | 'chapter' | 'verse' | 'translation'>): string {
  return `${verse.translation}|${verse.bookUsfm}|${verse.chapter}|${verse.verse}`;
}

function mergeUniqueHits(priority: SearchHit[], results: AppSearchResponse): AppSearchResponse {
  const seen = new Set(results.verses.map((verse) => `${verse.source}|${verseKey(verse)}`));
  const extras = priority.filter((verse) => {
    const key = `${verse.source}|${verseKey(verse)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (!extras.length) return results;
  return {
    verses: [...extras, ...results.verses],
    count: results.count + extras.length,
  };
}
