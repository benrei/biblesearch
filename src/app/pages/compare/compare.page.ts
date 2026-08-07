import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { translations } from 'src/app/constants/translations';
import { TextKey } from 'src/app/constants/text-key';
import { UrlPath } from 'src/app/constants/url-path';
import { Verse } from 'src/app/interfaces';
import { ApiService } from 'src/app/services/api.service';
import { ChapterNavigationService } from 'src/app/services/chapter-navigation.service';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-compare',
  imports: [
    PageHeaderComponent,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    RouterLink,
  ],
  template: `
    <app-page-header [toolbarTitle]="TextKey.Compare">
      <ion-button
        toolbarButton
        [routerLink]="['/read', leftTranslation(), bookUsfm(), chapter()]"
      >
        {{ bookUsfm() }} {{ chapter() }}
      </ion-button>
    </app-page-header>
    <ion-content class="ion-padding">
      @if (showFabs()) {
        <ion-fab slot="fixed" vertical="center" horizontal="start" (click)="navigateChapter('backward')">
          <ion-fab-button color="dark">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      }

      <div class="compare-controls">
        <span class="verse-num-spacer" aria-hidden="true"></span>
        <ion-select
          interface="popover"
          [value]="leftTranslation()"
          (ionChange)="updateTranslation('left', $event.detail.value)"
        >
          @for (t of translations; track t.usfm) {
            <ion-select-option [value]="t.usfm">{{ t.usfm }}</ion-select-option>
          }
        </ion-select>
        <ion-select
          interface="popover"
          [value]="rightTranslation()"
          (ionChange)="updateTranslation('right', $event.detail.value)"
        >
          @for (t of translations; track t.usfm) {
            <ion-select-option [value]="t.usfm">{{ t.usfm }}</ion-select-option>
          }
        </ion-select>
      </div>

      <table class="compare-table">
        <tbody>
          @for (row of verseRows(); track row.verse) {
            <tr>
              <td class="verse-num">{{ row.verse }}</td>
              <td>{{ row.left }}</td>
              <td>{{ row.right }}</td>
            </tr>
          }
        </tbody>
      </table>

      @if (showFabs()) {
        <ion-fab slot="fixed" vertical="center" horizontal="end" (click)="navigateChapter('forward')">
          <ion-fab-button color="dark">
            <ion-icon name="chevron-forward-outline"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      }
    </ion-content>
  `,
  styleUrl: './compare.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparePage implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly chapterNavigation = inject(ChapterNavigationService);

  protected readonly TextKey = TextKey;
  protected readonly translations = translations;
  protected readonly showFabs = signal(true);

  private readonly params = toSignal(this.route.params);
  private readonly queryParams = toSignal(this.route.queryParams);
  private readonly ionContent = viewChild(IonContent);

  protected readonly bookUsfm = computed(() => this.params()?.['bookUsfm'] ?? 'GEN');
  protected readonly chapter = computed(() => Number(this.params()?.['chapter'] ?? 1));
  protected readonly leftTranslation = computed(
    () => this.queryParams()?.['left'] || this.storage.get('translation') || 'KJV',
  );
  protected readonly rightTranslation = computed(() => {
    const left = this.leftTranslation();
    const right = this.queryParams()?.['right'];
    if (typeof right === 'string' && right) return right;
    return translations.find((t) => t.usfm !== left)?.usfm ?? 'NB';
  });

  protected readonly leftVerses = resource<
    Verse[],
    { translation: string; bookUsfm: string; chapter: number }
  >({
    params: () => ({
      translation: this.leftTranslation(),
      bookUsfm: this.bookUsfm(),
      chapter: this.chapter(),
    }),
    loader: ({ params }) =>
      this.api.getVerses(params.translation, params.bookUsfm, params.chapter),
    defaultValue: [],
  });

  protected readonly rightVerses = resource<
    Verse[],
    { translation: string; bookUsfm: string; chapter: number }
  >({
    params: () => ({
      translation: this.rightTranslation(),
      bookUsfm: this.bookUsfm(),
      chapter: this.chapter(),
    }),
    loader: ({ params }) =>
      this.api.getVerses(params.translation, params.bookUsfm, params.chapter),
    defaultValue: [],
  });

  protected readonly verseRows = computed(() => {
    const leftMap = new Map(this.leftVerses.value().map((v) => [v.verse, v.text]));
    const rightMap = new Map(this.rightVerses.value().map((v) => [v.verse, v.text]));
    const verseNumbers = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort(
      (a, b) => a - b,
    );
    return verseNumbers.map((verse) => ({
      verse,
      left: leftMap.get(verse) ?? '',
      right: rightMap.get(verse) ?? '',
    }));
  });

  constructor() {
    effect(() => {
      const left = this.leftTranslation();
      const right = this.rightTranslation();
      const query = this.queryParams();
      if (!query) return;
      if (query['left'] === left && query['right'] === right) return;

      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { left, right },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  ngAfterViewInit(): void {
    void this.ionContentScroll();
  }

  protected updateTranslation(side: 'left' | 'right', value: string): void {
    const left = side === 'left' ? value : this.leftTranslation();
    const right = side === 'right' ? value : this.rightTranslation();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { left, right },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected async navigateChapter(direction: 'forward' | 'backward'): Promise<void> {
    const target = await this.chapterNavigation.resolveAdjacentChapter(direction, {
      translation: this.leftTranslation(),
      bookUsfm: this.bookUsfm(),
      chapter: String(this.chapter()),
    });
    if (!target) return;

    void this.router.navigate([`/${UrlPath.compare}`, target.bookUsfm, target.chapter], {
      queryParams: {
        left: this.leftTranslation(),
        right: this.rightTranslation(),
      },
      replaceUrl: false,
    });
  }

  private async ionContentScroll(): Promise<void> {
    const content = this.ionContent();
    const scrollEl = await content?.getScrollElement();
    let lastScrollTop = 0;
    scrollEl?.addEventListener('scroll', () => {
      const currentScrollTop = scrollEl.scrollTop;
      const deltaY = currentScrollTop - lastScrollTop;
      this.showFabs.set(deltaY <= 0);
      lastScrollTop = currentScrollTop;
    });
  }
}
