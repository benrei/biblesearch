import { inject, Injectable } from '@angular/core';
import { Annotation, TagDefinition } from '../interfaces';
import { StorageService } from './storage.service';

const EXPORT_VERSION = 1;

/** JSON backup of highlights, notes, bookmarks and tags. */
export interface StudyDataExport {
  version: number;
  exportedAt: string;
  tagDefinitions: TagDefinition[];
  annotations: Annotation[];
}

@Injectable({ providedIn: 'root' })
export class StudyDataBackupService {
  private readonly storage = inject(StorageService);

  exportJson(): string {
    const payload: StudyDataExport = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      tagDefinitions: this.storage.get('tagDefinitions') ?? [],
      annotations: this.storage.get('annotations') ?? [],
    };
    return JSON.stringify(payload, null, 2);
  }

  downloadExport(): void {
    const blob = new Blob([this.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `biblesearch-study-data-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  importJson(raw: string, mode: 'merge' | 'replace'): void {
    const parsed = JSON.parse(raw) as StudyDataExport;
    if (!parsed || !Array.isArray(parsed.annotations) || !Array.isArray(parsed.tagDefinitions)) {
      throw new Error('Invalid study data file');
    }

    if (mode === 'replace') {
      this.storage.set('tagDefinitions', parsed.tagDefinitions);
      this.storage.set('annotations', parsed.annotations);
      return;
    }

    const tagsBySlug = new Map(
      (this.storage.get('tagDefinitions') ?? []).map((tag) => [tag.slug, tag]),
    );
    const tagIdMap = new Map<number, number>();
    for (const incoming of parsed.tagDefinitions) {
      const existing = tagsBySlug.get(incoming.slug);
      if (existing) {
        tagIdMap.set(incoming.id, existing.id);
      } else {
        tagsBySlug.set(incoming.slug, incoming);
        tagIdMap.set(incoming.id, incoming.id);
      }
    }

    const remappedTags = [...tagsBySlug.values()];
    const existingAnnotations = this.storage.get('annotations') ?? [];
    const existingIds = new Set(existingAnnotations.map((a) => a.id));
    const mergedAnnotations = [...existingAnnotations];

    for (const annotation of parsed.annotations) {
      let next = annotation;
      if (annotation.type === 'tag') {
        next = {
          ...annotation,
          tagIds: annotation.tagIds.map((id) => tagIdMap.get(id) ?? id),
        };
      }
      if (existingIds.has(next.id)) {
        next = { ...next, id: Date.now() + Math.floor(Math.random() * 1000) };
      }
      existingIds.add(next.id);
      mergedAnnotations.push(next);
    }

    this.storage.set('tagDefinitions', remappedTags);
    this.storage.set('annotations', mergedAnnotations);
  }
}
