import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { IonContent, IonPopover, IonSearchbar } from '@ionic/angular/standalone';
import { SearchResultsListComponent } from 'src/app/components/search-results-list/search-results-list.component';
import { TextKey } from 'src/app/constants/text-key';
import { SearchService } from './search.service';

@Component({
  selector: 'app-search',
  imports: [IonContent, IonPopover, IonSearchbar, SearchResultsListComponent],
  template: `
    <ion-popover
      alignment="center"
      side="bottom"
      [event]="{ clientX: 0, clientY: 64 }"
      [reference]="'event'"
      [showBackdrop]="true"
      [isOpen]="searchService.isSearchOpen()"
      (didDismiss)="searchService.togglePopover(false)"
      (didPresent)="onDidPresent()"
    >
      <ng-template>
        <ion-content>
          <ion-searchbar
            color="light"
            placeholder="Rom 8 | God so loved"
            (ionInput)="onSearchInput($event)"
            [value]="searchTerm()"
          ></ion-searchbar>
          <div class="search-results">
            <app-search-results-list
              [results]="searchService.visibleSearchResults()"
              [searchTerm]="searchTerm()"
              [loading]="searchService.searchResults.isLoading()"
              (loadNextPage)="searchService.loadNextPage()"
            ></app-search-results-list>
          </div>
        </ion-content>
      </ng-template>
    </ion-popover>
  `,
  styleUrl: './search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPopover {
  protected searchService = inject(SearchService);

  protected TextKey = TextKey;

  readonly ionSearchbar = viewChild.required(IonSearchbar);

  searchTerm = this.searchService.searchTerm;

  protected async onDidPresent(): Promise<void> {
    this.searchService.warmup();
    const searchbar = this.ionSearchbar();
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
}
