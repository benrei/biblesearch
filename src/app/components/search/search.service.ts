import { computed, inject, Injectable, linkedSignal, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, SearchReqParams, SearchResponse } from 'src/app/services/api.service';
import { BibleTranslationService } from 'src/app/services/bible-translation.service';

const SEARCH = 'search';
const QUERY = 'query';
const SORT = 'sort';
const PAGE = 'page';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private bibleTranslation = inject(BibleTranslationService);

  // Convert queryParams Observable to a Signal
  queryParams = toSignal(this.activatedRoute.queryParams);
  isSearchOpen = computed(() => this.queryParams()?.[SEARCH] === 'open');
  searchTerm = computed(() => this.queryParams()?.[QUERY] || '');
  sortOrder = computed(() => (this.queryParams()?.[SORT] as 'relevance' | 'chronological') || 'chronological');
  page = computed(() => Math.max(1, Math.floor(Number(this.queryParams()?.[PAGE]) || 1)));
  private searchParams = computed<SearchReqParams>(() => ({
    ...(this.queryParams() as SearchReqParams),
    page: this.page(),
    translations: this.bibleTranslation.translation() || 'KJV',
  }));

  warmup(): void {
    const translation = this.bibleTranslation.translation();
    if (translation) {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(() => void this.apiService.getBooks(translation));
      } else {
        setTimeout(() => void this.apiService.getBooks(translation), 50);
      }
    }
  }

  searchResults = resource<SearchResponse, SearchReqParams>({
    params: this.searchParams,
    loader: async ({ params }) => {
      const trimmedQuery = params.query?.trim() || '';
      if (trimmedQuery.length < 2) return { verses: [], count: 0 };
      return this.apiService.search({ ...params, query: trimmedQuery });
    },
  });

  visibleSearchResults = linkedSignal<
    { page: number; results: SearchResponse | undefined },
    SearchResponse | undefined
  >({
    source: computed(() => ({ page: this.page(), results: this.searchResults.value() })),
    computation: ({ page, results }, previous) =>
      results ?? (page > 1 ? previous?.value : undefined),
  });

  // Toggle popover and update URL
  togglePopover(open: boolean) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      // search=open
      queryParams: { [SEARCH]: open ? 'open' : null },
      queryParamsHandling: 'merge',
    });
  }

  updateSearchQueryParam(value: string): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { [QUERY]: value || null, [PAGE]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  updateSortOrder(value: 'relevance' | 'chronological'): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { [SORT]: value === 'chronological' ? null : value, [PAGE]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  loadNextPage(): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { [PAGE]: this.page() + 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
