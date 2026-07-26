import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  InfiniteScrollCustomEvent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonText,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@angular-libs/translate';
import { TextKey } from 'src/app/constants/text-key';
import { Verse } from 'src/app/interfaces';
import { HighlightSearchPipe } from 'src/app/pipes/highlight-search.pipe';
import { SearchResponse } from 'src/app/services/api.service';

@Component({
  selector: 'app-search-results-list',
  imports: [IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonText, RouterLink, TranslatePipe, HighlightSearchPipe],
  templateUrl: './search-results-list.component.html',
  styleUrl: './search-results-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsListComponent {
  results = input.required<SearchResponse | undefined>();
  searchTerm = input.required<string>();
  loading = input(false);
  loadNextPage = output<void>();

  TextKey = TextKey;

  getListHeader(data: Verse) {
    const { bookName, chapter, verse } = data;
    return `${bookName} ${chapter}:${verse}`;
  }

  protected loadMore(event: InfiniteScrollCustomEvent): void {
    this.loadNextPage.emit();
    void event.target.complete();
  }
}
