import { AfterViewInit, ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { IonContent, IonSearchbar, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { TranslatePipe } from '@angular-libs/translate';
import { LanguageSelectComponent } from 'src/app/components/language-select/language-select.component';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { SearchResultsListComponent } from 'src/app/components/search-results-list/search-results-list.component';
import { SearchService } from 'src/app/components/search/search.service';
import { TextKey } from '../../constants/text-key';
import { QueryParam } from '../../constants/query-param';

@Component({
  imports: [
    LanguageSelectComponent,
    PageHeaderComponent,
    IonContent,
    IonSearchbar,
    SearchResultsListComponent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    TranslatePipe,
  ],
  styleUrl: './search.page.css',
  templateUrl: './search.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage implements AfterViewInit {
  protected searchService = inject(SearchService);

  protected readonly TextKey = TextKey;
  protected readonly QueryParam = QueryParam;
  protected readonly searchbar = viewChild.required(IonSearchbar);

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.searchbar().setFocus());
  }

  protected onSearchInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const value = element.value;
    this.searchService.updateSearchQueryParam(value);
  }

  protected onSortChange(event: Event) {
    const customEvent = event as CustomEvent;
    const value = customEvent.detail.value as 'relevance' | 'chronological';
    this.searchService.updateSortOrder(value);
  }
}
