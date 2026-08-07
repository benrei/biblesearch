import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  InfiniteScrollCustomEvent,
  IonChip,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonText,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@angular-libs/translate';
import { TextKey } from 'src/app/constants/text-key';
import { SearchHit } from 'src/app/interfaces';
import { HighlightSearchPipe } from 'src/app/pipes/highlight-search.pipe';
import { AppSearchResponse } from 'src/app/components/search/search.service';

@Component({
  selector: 'app-search-results-list',
  imports: [
    IonChip,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonText,
    RouterLink,
    TranslatePipe,
    HighlightSearchPipe,
  ],
  templateUrl: './search-results-list.component.html',
  styleUrl: './search-results-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsListComponent {
  results = input.required<AppSearchResponse | undefined>();
  searchTerm = input.required<string>();
  loading = input(false);
  loadNextPage = output<void>();

  TextKey = TextKey;

  getListHeader(data: SearchHit) {
    const { bookName, chapter, verse } = data;
    return `${bookName} ${chapter}:${verse}`;
  }

  protected sourceIcon(hit: SearchHit): string {
    if (hit.source === 'note') return 'document-text-outline';
    if (hit.source === 'tag') return 'pricetag-outline';
    return 'book-outline';
  }

  protected loadMore(event: InfiniteScrollCustomEvent): void {
    this.loadNextPage.emit();
    void event.target.complete();
  }
}
