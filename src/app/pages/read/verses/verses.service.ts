import { computed, effect, inject, Injectable, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AnnotatedVerse, Verse } from '../../../interfaces';
import { VersePageParams } from '../../../interfaces/route-params';
import { ApiService } from '../../../services/api.service';
import { StorageService } from '../../../services/storage.service';
import { AnnotationService } from '../../../services/annotation.service';

@Injectable()
export class VersesService {
  private apiService = inject(ApiService);
  private storage = inject(StorageService);
  private route = inject(ActivatedRoute);
  private annotations = inject(AnnotationService);

  // Signals
  routeParams = toSignal<VersePageParams>(this.route.params as any);
  chapterHighlights = computed(() => {
    const { bookUsfm, chapter, translation } = this.routeParams()!;
    return this.annotations.highlights().filter((highlight) =>
      highlight.targets.some(
        (target) =>
          target.bookUsfm === bookUsfm &&
          target.chapter === +chapter &&
          target.translation === translation,
      ),
    );
  });
  chapterNotes = computed(() => {
    const { bookUsfm, chapter, translation } = this.routeParams()!;
    return this.annotations.notes().filter((note) =>
      note.targets.some(
        (target) =>
          target.bookUsfm === bookUsfm &&
          target.chapter === +chapter &&
          target.translation === translation,
      ),
    );
  });
  chapterTagAnnotations = computed(() => {
    const { bookUsfm, chapter, translation } = this.routeParams()!;
    return this.annotations.tagAnnotations().filter((annotation) =>
      annotation.targets.some(
        (target) =>
          target.bookUsfm === bookUsfm &&
          target.chapter === +chapter &&
          target.translation === translation,
      ),
    );
  });
  versesIncMetadata = computed<AnnotatedVerse[]>(() => {
    const verses = this.versesResource.value();
    const tagDefinitions = this.annotations.tagDefinitions();
    return verses.map((verse) => {
      const highlights = this.chapterHighlights().filter((highlight) =>
        highlight.targets.some((target) => target.verse === verse.verse),
      );
      const notes = this.chapterNotes().filter((note) =>
        note.targets.some((target) => target.verse === verse.verse),
      );
      const tagIds = new Set(
        this.chapterTagAnnotations()
          .filter((annotation) => annotation.targets.some((target) => target.verse === verse.verse))
          .flatMap((annotation) => annotation.tagIds),
      );
      const tags = tagDefinitions.filter((tag) => tagIds.has(tag.id));
      return { ...verse, highlights, notes, tags };
    });
  });

  constructor() {
    effect(() => {
      const firstVerse = this.versesResource.value()[0];
      if (!firstVerse) return;

      const { chapter, bookName, translation, bookUsfm } = firstVerse;
      this.storage.set('recentRead', {
        chapter,
        bookName,
        bookUsfm,
        translation,
      });
    });
  }
  versesResource = resource<Verse[], VersePageParams>({
    params: () => this.routeParams()!,
    loader: async ({ params }) => {
      const { translation, bookUsfm, chapter } = params;
      if (!params) return [];
      const verses = await this.apiService.getVerses(translation, bookUsfm, chapter);
      return verses;
    },
    defaultValue: [],
  });

  removeNoteFromVerses(verses: AnnotatedVerse[], noteId: number) {
    return verses.map((verse) => ({
      ...verse,
      notes: verse.notes.filter((n) => n.id !== noteId),
    }));
  }

}
