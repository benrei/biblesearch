import { computed, inject, Injectable } from '@angular/core';
import {
  Annotation,
  VerseTarget,
  VerseSelection,
  BookmarkAnnotation,
  HighlightAnnotation,
  NoteAnnotation,
  TagAnnotation,
  TagDefinition,
} from '../interfaces';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AnnotationService {
  private readonly storage = inject(StorageService);

  readonly annotations = this.storage.getSignal('annotations');
  readonly tagDefinitions = this.storage.getSignal('tagDefinitions');
  readonly highlights = computed(() =>
    this.annotations().filter(
      (annotation): annotation is HighlightAnnotation => annotation.type === 'highlight',
    ),
  );
  readonly notes = computed(() =>
    this.annotations().filter(
      (annotation): annotation is NoteAnnotation => annotation.type === 'note',
    ),
  );
  readonly bookmarks = computed(() =>
    this.annotations().filter(
      (annotation): annotation is BookmarkAnnotation => annotation.type === 'bookmark',
    ),
  );
  readonly tagAnnotations = computed(() =>
    this.annotations().filter(
      (annotation): annotation is TagAnnotation => annotation.type === 'tag',
    ),
  );

  createNote(targets: VerseTarget[]): NoteAnnotation {
    const now = new Date();
    return {
      id: now.getTime(),
      type: 'note',
      targets,
      content: '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  saveBookmark(targets: VerseTarget[]): void {
    const now = new Date();
    const bookmark: BookmarkAnnotation = {
      id: now.getTime(),
      type: 'bookmark',
      targets: targets.map((target) => ({
        translation: target.translation,
        bookNumber: target.bookNumber,
        bookUsfm: target.bookUsfm,
        bookName: target.bookName,
        chapter: target.chapter,
        verse: target.verse,
      })),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const otherAnnotations = this.storage
      .get('annotations')
      .filter((annotation) => annotation.type !== 'bookmark');
    const bookmarks = [bookmark, ...this.bookmarks()].slice(
      0,
      this.storage.get('bookmarksLimit'),
    );
    this.storage.set('annotations', [...otherAnnotations, ...bookmarks]);
  }

  saveHighlight(selection: VerseSelection, color: string): void {
    const annotations = this.storage.get('annotations');
    const retained = annotations.filter((annotation) => {
      if (annotation.type !== 'highlight') return true;
      if (annotation.id === selection.highlightId) return false;
      return !this.haveSameTargets(annotation.targets, selection.targets);
    });

    if (!color) {
      this.storage.set('annotations', retained);
      return;
    }

    const now = new Date();
    const highlight: HighlightAnnotation = {
      id: now.getTime(),
      type: 'highlight',
      targets: selection.targets,
      color,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.storage.set('annotations', [...retained, highlight]);
  }

  createTagDefinition(name: string): TagDefinition {
    const trimmed = name.trim();
    const slug = this.slugify(trimmed);
    const definitions = this.storage.get('tagDefinitions') ?? [];
    const existing = definitions.find((tag) => tag.slug === slug);
    if (existing) return existing;

    const now = new Date().toISOString();
    const tag: TagDefinition = {
      id: Date.now(),
      name: trimmed,
      slug,
      createdAt: now,
      updatedAt: now,
    };
    this.storage.set('tagDefinitions', [...definitions, tag]);
    return tag;
  }

  getTagIdsForSelection(selection: VerseSelection): number[] {
    return (
      this.tagAnnotations().find((annotation) =>
        this.haveSameTargets(annotation.targets, selection.targets),
      )?.tagIds ?? []
    );
  }

  toggleTagOnSelection(selection: VerseSelection, tagId: number): void {
    const currentIds = this.getTagIdsForSelection(selection);
    const nextIds = currentIds.includes(tagId)
      ? currentIds.filter((id) => id !== tagId)
      : [...currentIds, tagId];
    this.saveTagsForSelection(selection, nextIds);
  }

  saveTagsForSelection(selection: VerseSelection, tagIds: number[]): void {
    const annotations = this.storage.get('annotations');
    const retained = annotations.filter((annotation) => {
      if (annotation.type !== 'tag') return true;
      return !this.haveSameTargets(annotation.targets, selection.targets);
    });

    if (!tagIds.length) {
      this.storage.set('annotations', retained);
      return;
    }

    const now = new Date();
    const existing = this.tagAnnotations().find((annotation) =>
      this.haveSameTargets(annotation.targets, selection.targets),
    );
    const tagAnnotation: TagAnnotation = {
      id: existing?.id ?? now.getTime(),
      type: 'tag',
      targets: selection.targets.map((target) => ({
        translation: target.translation,
        bookNumber: target.bookNumber,
        bookUsfm: target.bookUsfm,
        bookName: target.bookName,
        chapter: target.chapter,
        verse: target.verse,
        startOffset: target.startOffset,
        endOffset: target.endOffset,
        quote: target.quote,
        textBefore: target.textBefore,
        textAfter: target.textAfter,
      })),
      tagIds: [...new Set(tagIds)],
      createdAt: existing?.createdAt ?? now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.storage.set('annotations', [...retained, tagAnnotation]);
  }

  deleteTagDefinition(tagId: number): void {
    this.storage.set(
      'tagDefinitions',
      (this.storage.get('tagDefinitions') ?? []).filter((tag) => tag.id !== tagId),
    );
    const annotations: Annotation[] = [];
    for (const annotation of this.storage.get('annotations')) {
      if (annotation.type !== 'tag') {
        annotations.push(annotation);
        continue;
      }
      const tagIds = annotation.tagIds.filter((id) => id !== tagId);
      if (!tagIds.length) continue;
      annotations.push({ ...annotation, tagIds, updatedAt: new Date().toISOString() });
    }
    this.storage.set('annotations', annotations);
  }

  findTagBySlug(slug: string): TagDefinition | undefined {
    return this.tagDefinitions().find((tag) => tag.slug === slug);
  }

  getAnnotationsForTag(tagId: number): TagAnnotation[] {
    return this.tagAnnotations().filter((annotation) => annotation.tagIds.includes(tagId));
  }

  removeTagFromAnnotation(annotationId: number, tagId: number): void {
    const annotation = this.tagAnnotations().find((candidate) => candidate.id === annotationId);
    if (!annotation) return;

    const tagIds = annotation.tagIds.filter((id) => id !== tagId);
    if (!tagIds.length) {
      this.deleteAnnotation(annotationId);
      return;
    }

    this.save({ ...annotation, tagIds });
  }

  save(annotation: Annotation): void {
    const annotations = this.storage.get('annotations');
    const updated = { ...annotation, updatedAt: new Date().toISOString() };
    this.storage.set('annotations', [
      ...annotations.filter((existing) => existing.id !== annotation.id),
      updated,
    ]);
  }

  deleteAnnotation(id: number): void {
    this.storage.set(
      'annotations',
      this.storage.get('annotations').filter((annotation) => annotation.id !== id),
    );
  }

  getHighlightColor(selection: VerseSelection): string | undefined {
    return this.highlights().find(
      (highlight) =>
        selection.highlightId === highlight.id ||
        this.haveSameTargets(highlight.targets, selection.targets),
    )?.color;
  }

  private slugify(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private haveSameTargets(first: VerseTarget[], second: VerseTarget[]): boolean {
    return (
      first.length === second.length &&
      first.every((target, index) => {
        const other = second[index];
        return (
          target.translation === other.translation &&
          target.bookUsfm === other.bookUsfm &&
          target.chapter === other.chapter &&
          target.verse === other.verse &&
          target.startOffset === other.startOffset &&
          target.endOffset === other.endOffset
        );
      })
    );
  }
}
