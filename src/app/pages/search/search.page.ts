import { AfterViewInit, ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import {
  IonContent,
  IonLabel,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@angular-libs/translate';
import { LanguageSelectComponent } from 'src/app/components/language-select/language-select.component';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { SearchResultsListComponent } from 'src/app/components/search-results-list/search-results-list.component';
import { AnnotationHasFilter, SearchService } from 'src/app/components/search/search.service';
import { TextKey } from '../../constants/text-key';

@Component({
  imports: [
    LanguageSelectComponent,
    PageHeaderComponent,
    IonContent,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    SearchResultsListComponent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    TranslatePipe,
  ],
  styleUrl: './search.page.scss',
  templateUrl: './search.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage implements AfterViewInit {
  protected searchService = inject(SearchService);

  protected readonly TextKey = TextKey;
  protected readonly searchbar = viewChild.required(IonSearchbar);

  async ngAfterViewInit(): Promise<void> {
    this.searchService.warmup();
    const searchbar = this.searchbar();
    if (searchbar) {
      await searchbar.getInputElement();
      await searchbar.setFocus();
    }
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

  protected onBookChange(event: Event) {
    const value = (event as CustomEvent).detail.value as string;
    this.searchService.updateBookFilter(value || null);
  }

  protected onHasChange(event: Event) {
    const value = (event as CustomEvent).detail.value as AnnotationHasFilter;
    this.searchService.updateHasFilter(value || null);
  }
}
