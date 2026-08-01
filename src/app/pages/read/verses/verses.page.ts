import {
  AfterViewInit,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSearchbar,
  NavController,
} from '@ionic/angular/standalone';
import { IonContentCustomEvent, ScrollDetail } from '@ionic/core';
import { NavigationOptions } from 'node_modules/@ionic/angular/common/providers/nav-controller';
import { BackButtonComponent } from 'src/app/components/back-button/back-button.component';
import { LanguageSelectComponent } from 'src/app/components/language-select/language-select.component';
import { NoteModalService } from 'src/app/components/note-modal/note-modal.service';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { SearchService } from 'src/app/components/search/search.service';
import { VerseActionsModalService } from 'src/app/components/verse-actions-modal/verse-actions-modal.service';
import { TextKey } from 'src/app/constants/text-key';
import { UrlPath } from 'src/app/constants/url-path';
import { PageSwipeDirective } from 'src/app/directives/page-swipe.directive';
import { AnnotatedVerse, VerseTarget, VerseSelection, NoteAnnotation } from 'src/app/interfaces';
import { ChapterNavigationService } from 'src/app/services/chapter-navigation.service';
import { ScrollVerseTrackerService } from 'src/app/services/scroll-verse-tracker.service';
import { StorageService } from 'src/app/services/storage.service';
import { VersesService } from 'src/app/pages/read/verses/verses.service';
import { VerseReaderComponent } from './verse-reader.component';
import { QueryParam } from 'src/app/constants/query-param';

@Component({
  selector: 'app-verses',
  imports: [
    BackButtonComponent,
    LanguageSelectComponent,
    PageHeaderComponent,
    PageSwipeDirective,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    VerseReaderComponent,
  ],
  templateUrl: './verses.page.html',
  styleUrls: ['./verses.page.scss'],
  providers: [VersesService],
})
export class VersesPage implements AfterViewInit {
  private chapterNavigationService = inject(ChapterNavigationService);
  private navController = inject(NavController);
  private noteModalService = inject(NoteModalService);
  private route = inject(ActivatedRoute);
  private scrollVerseTracker = inject(ScrollVerseTrackerService);
  private storage = inject(StorageService);
  private verseActionsModalService = inject(VerseActionsModalService);
  private versesService = inject(VersesService);
  protected searchService = inject(SearchService);

  protected TextKey = TextKey;

  // Signals
  protected ionSearchbar = viewChild(IonSearchbar);
  protected routeData = toSignal(this.route.data);
  protected routeQueryParams = toSignal(this.route.queryParams);
  protected routeFragment = toSignal(this.route.fragment);
  protected search = signal('');
  protected selection = signal<VerseSelection>({ targets: [] });
  protected showFabs = signal(true);

  protected versesIncMetadata = this.versesService.versesIncMetadata;
  protected versesToFocus = computed(() => {
    const verse = this.routeQueryParams()?.[QueryParam.FocusVerses] as string;
    return verse?.split(',').map(Number) || [];
  });

  private ionContent = viewChild(IonContent);

  constructor() {
    effect(() => {
      this.storage.set('routeFragment', this.routeFragment() ?? '');
      const verses = this.versesIncMetadata();
      if (verses && verses.length > 0) {
        this.scrollToVerse(untracked(() => this.routeFragment()));
      }
    });
  }

  ngAfterViewInit(): void {
    this.ionContentScroll();
  }

  async onActionFabClick() {
    const modal = await this.verseActionsModalService.openModal(this.selection());
    modal.onDidDismiss().then(() => {
      this.selection.set({ targets: [] });
      window.getSelection()?.removeAllRanges();
    });
  }

  async onNoteClick(event: Event, note: NoteAnnotation) {
    event.stopImmediatePropagation();
    this.noteModalService.openModal(note);
  }

  onVerseClick(verse: AnnotatedVerse) {
    const target: VerseTarget = {
      translation: verse.translation,
      bookNumber: verse.bookNumber,
      bookUsfm: verse.bookUsfm,
      bookName: verse.bookName,
      chapter: verse.chapter,
      verse: verse.verse,
      quote: verse.text,
    };
    this.selection.update((current) => {
      const isSelected = current.targets.some((selected) => selected.verse === verse.verse);
      const targets = isSelected
        ? current.targets.filter((selected) => selected.verse !== verse.verse)
        : [...current.targets, target].sort((first, second) => first.verse - second.verse);
      return { targets };
    });
  }

  onTextSelection(selection: VerseSelection) {
    this.selection.set(selection);
  }

  protected navigateForward(options?: NavigationOptions) {
    this.chapterNavigationService.navigateChapter(
      'forward',
      this.versesService.routeParams()!,
      options,
    );
  }

  protected navigateBack(options?: NavigationOptions) {
    this.chapterNavigationService.navigateChapter(
      'backward',
      this.versesService.routeParams()!,
      options,
    );
  }

  protected onScroll(event: IonContentCustomEvent<ScrollDetail>) {
    this.showFabs.set(event.detail.deltaY <= 0);
  }

  protected goBackToChapters() {
    const { translation, bookUsfm } = this.versesService.routeParams()!;
    this.navController.navigateBack([`/${UrlPath.read}/${translation}/${bookUsfm}`]);
  }

  private async ionContentScroll() {
    const content = this.ionContent();
    const scrollEl = await content?.getScrollElement();
    let lastScrollTop = 0;
    scrollEl?.addEventListener('scroll', () => {
      const currentScrollTop = scrollEl.scrollTop;
      const deltaY = currentScrollTop - lastScrollTop;
      this.showFabs.set(deltaY <= 0);
      lastScrollTop = currentScrollTop;

      this.scrollVerseTracker.updateTopVerse(scrollEl);
    });
  }

  private async scrollToVerse(fragment?: string | null) {
    if (!fragment) return;
    requestAnimationFrame(() => {
      const element = document.getElementById(fragment);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}
