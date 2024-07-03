import { Injectable } from '@angular/core';
import { Verse } from '../pages/read/verses/verses.page';
import { books } from '../constants/books-chapters';

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  recentRead?: RecentRead;
  bookmarks: Verse[] = [];
  constructor() {
    this.bookmarks = this.getBookmarks();
    this.recentRead = this.getLastRead();
  }

  addVerseToLocalStorage(verse: Verse) {
    // Retrieve the array from localStorage
    const bookmarks = this.getBookmarks();
    // Check the length of the array
    if (bookmarks.length >= 5) {
      // Remove the last element if the array is at max length
      bookmarks.pop();
    }
    // Add the new value to the beginning of the array
    bookmarks.unshift(verse);
    this.bookmarks = bookmarks;
    // Store the updated array back to localStorage
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }

  getBookmarks() {
    return JSON.parse(localStorage.getItem('bookmarks') || '[]');
  }

  getLastRead() {
    return JSON.parse(localStorage.getItem('lastRead') || '{}');
  }

  setLastRead(recentRead: RecentRead) {
    const bookId = Number(recentRead['book']);
    const book = books.find((b) => b.id === bookId);
    const recent = { ...recentRead, bookName: book?.name };
    this.recentRead = recent;
    localStorage.setItem('lastRead', JSON.stringify(recent));
  }
}

export interface RecentRead {
  book: number;
  bookName?: string;
  chapter: number;
}
