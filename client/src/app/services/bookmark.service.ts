import { Injectable } from '@angular/core';
import { books } from '../constants/books-chapters';
import { Bookmark, RecentRead, Verse } from '../interfaces';
import Utils from '../utils/utils';

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  recentRead?: RecentRead;
  bookmarks: Bookmark[] = [];
  constructor() {
    this.bookmarks = this.getBookmarks();
    this.recentRead = this.getRecentRead();
  }

  saveVersesAsBookmark(verses: Verse[]) {
    const bookmark = Utils.convertVersesToBookmark(verses);
    // Retrieve the array from localStorage
    const bookmarks = this.getBookmarks();
    // Check the length of the array
    if (bookmarks.length >= 5) {
      // Remove the last element if the array is at max length
      bookmarks.pop();
    }
    // Add the new value to the beginning of the array
    bookmarks.unshift(bookmark);
    this.bookmarks = bookmarks;
    // Store the updated array back to localStorage
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }

  getBookmarks() {
    return JSON.parse(localStorage.getItem('bookmarks') || '[]');
  }

  getRecentRead() {
    return JSON.parse(localStorage.getItem('recentRead') || 'null');
  }

  setRecentRead(recentRead: RecentRead) {
    const bookId = Number(recentRead['book']);
    const book = books.find((b) => b.id === bookId);
    const recent = { ...recentRead, bookName: book?.name };
    this.recentRead = recent;
    localStorage.setItem('recentRead', JSON.stringify(recent));
  }
}
