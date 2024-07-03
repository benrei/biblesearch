import { Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ActionSheetButton,
  IonActionSheet,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { combineLatest, debounceTime } from 'rxjs';
import { books } from 'src/app/constants/books-chapters';
import { ApiService } from 'src/app/services/api.service';
import { BookmarkService, RecentRead } from 'src/app/services/bookmark.service';

@Component({
  selector: 'app-verses',
  standalone: true,
  imports: [
    IonActionSheet,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
  ],
  templateUrl: './verses.page.html',
  styleUrls: ['./verses.page.scss'],
})
export class VersesPage {
  chapter = ''; // John 1
  verses: Verse[] = [];
  verseFocused = false;
  verseToFocus?: number;
  selectedVerse: Verse | undefined;
  actionSheetButtons: ActionSheetButton[] = [
    {
      icon: 'bookmark-outline',
      text: 'Bookmark',
      role: 'bookmark',
    },
  ];

  private lastParams: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private bookmarkService: BookmarkService
  ) {
    combineLatest([this.route.params, this.route.queryParams])
      .pipe(debounceTime(0), takeUntilDestroyed())
      .subscribe(([params, queryParams]) => {
        const { verse } = queryParams;
        const verseNumber = Number(verse);
        if (verseNumber && verseNumber !== this.verseToFocus) {
          this.verseToFocus = Number(verse);
          this.verseFocused = false;
        }
        if (this.lastParams !== params) {
          this.bookmarkService.setLastRead(params as RecentRead);
          this.getVerses();
        } else {
          this.focusVerse(verse);
        }
        this.lastParams = params;
      });
  }

  onDismiss(event: any) {
    const { data, role } = event.detail;
    switch (role) {
      case 'backdrop':
        break;
      case 'bookmark':
        this.bookmarkService.addVerseToLocalStorage(this.selectedVerse!);
    }
    this.selectedVerse = undefined;
  }

  navigateBack() {
    const { book, chapter } = this.route.snapshot.params;
    let newBook = Number(book);
    let newChapter = Number(chapter);

    if (newChapter > 1) {
      newChapter--;
    } else if (newBook > 1) {
      newBook--;
      const previousBook = books.find((b) => b.id === newBook);
      newChapter = previousBook?.chapters || 1;
    }

    this.router.navigate([`/read/${newBook}/${newChapter}`]);
  }

  navigateForward() {
    const { book, chapter } = this.route.snapshot.params;
    let newBook = Number(book);
    let newChapter = Number(chapter);
    const currentBook = books.find((b) => b.id === newBook);

    if (newChapter < (currentBook?.chapters || 0)) {
      newChapter++;
    } else if (newBook < books.length) {
      newBook++;
      newChapter = 1;
    }

    this.router.navigate([`/read/${newBook}/${newChapter}`]);
  }

  private getVerses() {
    const { verse } = this.route.snapshot.queryParams;
    const { book, chapter } = this.route.snapshot.params;
    const bookData = books.find((b) => b.id === Number(book));
    this.chapter = `${bookData?.name} ${chapter}`;
    this.apiService.getVerses(book, chapter).subscribe((verses) => {
      this.verses = verses;
      this.focusVerse(verse);
    });
  }

  private focusVerse(verse: string) {
    if (verse && !this.verseFocused) {
      setTimeout(() => {
        const element = document.getElementById(`verse-${verse}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          this.verseFocused = true;
        }
      });
    }
  }
}

export interface Verse {
  id: number;
  book_name: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}
