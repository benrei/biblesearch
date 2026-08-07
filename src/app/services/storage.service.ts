import { Injectable } from '@angular/core';
import { ALStore, persistPlugin } from '@angular-libs/store';

import { Annotation, RecentRead, TagDefinition } from '../interfaces';

type AppStorage = {
  annotations: Annotation[];
  bookmarksLimit: number;
  darkMode: boolean;
  fontSize: number;
  language: string;
  recentRead: RecentRead | null;
  renderNotes: boolean;
  /** Route fragment. Url `#verse-17` */
  routeFragment: string | undefined;
  startPage: StartPage;
  tagDefinitions: TagDefinition[];
  translation: string;
};

const initialValues: AppStorage = {
  annotations: [],
  bookmarksLimit: 5,
  darkMode: true,
  fontSize: 16,
  language: navigator.language.slice(0, 2),
  recentRead: {
    bookName: 'Genesis',
    bookUsfm: 'GEN',
    chapter: 1,
    translation: 'KJV',
  },
  renderNotes: false,
  routeFragment: '',
  startPage: 'search',
  tagDefinitions: [],
  translation: 'KJV',
};

export type StartPage = 'recentRead' | 'bookmarks' | 'notes' | 'search' | 'read';

@Injectable({ providedIn: 'root' })
export class StorageService extends ALStore<AppStorage> {
  constructor() {
    super(initialValues);
    this.registerPlugin(persistPlugin('all'));
  }
}
