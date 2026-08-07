import { inject, Injectable } from '@angular/core';
import { NavController } from '@ionic/angular/standalone';
import { NavigationOptions } from 'node_modules/@ionic/angular/common/providers/nav-controller';
import { UrlPath } from 'src/app/constants/url-path';
import { Book } from 'src/app/interfaces';
import { VersePageParams } from 'src/app/interfaces/route-params';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ChapterNavigationService {
  private apiService = inject(ApiService);
  private navController = inject(NavController);

  async navigateChapter(
    direction: 'forward' | 'backward',
    versePageParams: VersePageParams,
    navOptions?: NavigationOptions,
  ) {
    const { translation, bookUsfm, chapter } = versePageParams;
    const targetChapter = await this.resolveAdjacentChapter(direction, {
      translation,
      bookUsfm,
      chapter,
    });
    if (!targetChapter) return;

    const url = `/${UrlPath.read}/${translation}/${targetChapter.bookUsfm}/${targetChapter.chapter}`;
    direction === 'forward'
      ? this.navController.navigateForward(url, navOptions)
      : this.navController.navigateBack(url, navOptions);
  }

  async resolveAdjacentChapter(
    direction: 'forward' | 'backward',
    params: Pick<VersePageParams, 'translation' | 'bookUsfm' | 'chapter'>,
  ): Promise<{ bookUsfm: string; chapter: number } | null> {
    const { translation, bookUsfm, chapter } = params;
    const books = await this.apiService.getBooks(translation);
    const currentBook = books.find((b) => b.usfm === bookUsfm);
    if (!currentBook) return null;

    return this.calculateTargetChapter(currentBook, Number(chapter), direction, books);
  }

  private calculateTargetChapter(
    currentBook: Book,
    currentChapter: number,
    direction: 'forward' | 'backward',
    books: Book[],
  ): { bookUsfm: string; chapter: number } | null {
    const increment = direction === 'forward' ? 1 : -1;
    const boundaryCheck =
      direction === 'forward' ? currentChapter < currentBook.chapters : currentChapter > 1;

    if (boundaryCheck) {
      return { bookUsfm: currentBook.usfm, chapter: currentChapter + increment };
    }

    const adjacentBook = books.find((b) => b.bookNumber === currentBook.bookNumber + increment);
    if (!adjacentBook) return null;

    return {
      bookUsfm: adjacentBook.usfm,
      chapter: direction === 'forward' ? 1 : adjacentBook.chapters,
    };
  }
}
