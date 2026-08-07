import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonRouterLink,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@angular-libs/translate';
import { TextKey } from 'src/app/constants/text-key';
import { BibleTranslationService } from 'src/app/services/bible-translation.service';
import { BookmarkService } from 'src/app/services/bookmark.service';
import { RouterNavigationService } from 'src/app/services/router-navigation.service';
import BookmarkUtils from 'src/app/utils/bookmark.utils';
import { SearchPopover } from '../search/search.component';
import { slideAnimation } from './slide.animation';
import { StorageService } from 'src/app/services/storage.service';
import { BookmarkAnnotation } from 'src/app/interfaces';

@Component({
  selector: 'app-layout',
  imports: [
    SearchPopover,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonMenu,
    IonMenuToggle,
    IonNote,
    IonRouterLink,
    IonRouterOutlet,
    IonSplitPane,
    IonTitle,
    IonToolbar,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
  ],
  template: `
    <app-search></app-search>
    <ion-split-pane contentId="main-content">
      <ion-menu contentId="main-content" type="overlay">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ TextKey.AppTitle | translate }}</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-note>{{ TextKey.AppDescription | translate }}</ion-note>
          <ion-list>
            @for (page of appPages; track $index) {
              <ion-menu-toggle auto-hide="false">
                <ion-item
                  detail="false"
                  lines="none"
                  routerDirection="root"
                  routerLinkActive="selected"
                  [button]="true"
                  [routerLink]="[page.url]"
                >
                  <ion-icon
                    slot="start"
                    [ios]="page.icon + '-outline'"
                    [md]="page.icon + '-sharp'"
                  ></ion-icon>
                  <ion-label>{{ page.title | translate }}</ion-label>
                </ion-item>
              </ion-menu-toggle>
            }
          </ion-list>
          @let recentRead = this.bookmarkService.recentRead();
          <ion-list class="bookmarks-list">
            <ion-menu-toggle auto-hide="false">
              <ion-list-header>{{ TextKey.RecentRead | translate }}</ion-list-header>
              @if (recentRead) {
                <ion-item
                  detail="false"
                  lines="none"
                  routerDirection="root"
                  routerLinkActive="selected"
                  [fragment]="fragment() ?? undefined"
                  [routerLink]="['/read', translation(), recentRead.bookUsfm, recentRead.chapter]"
                >
                  <ion-icon slot="start" ios="time-outline" md="time-sharp"></ion-icon>
                  <ion-label>
                    {{ recentReadBookName() }}
                    {{ recentRead.chapter }}
                  </ion-label>
                </ion-item>
              }
            </ion-menu-toggle>
          </ion-list>

          <ion-list class="bookmarks-list">
            <ion-menu-toggle auto-hide="false">
              <ion-list-header>{{ TextKey.Bookmarks | translate }}</ion-list-header>

              @for (bookmark of this.bookmarkService.bookmarks(); track $index) {
                @let firstTarget = bookmark.targets[0];
                <ion-item
                  detail="false"
                  lines="none"
                  routerDirection="root"
                  routerLinkActive="selected"
                  [routerLink]="[
                    '/read',
                    firstTarget.translation,
                    firstTarget.bookUsfm,
                    firstTarget.chapter,
                  ]"
                  [queryParams]="{ focusVerses: getBookmarkVerses(bookmark) }"
                >
                  <ion-icon slot="start" ios="bookmark-outline" md="bookmark-sharp"></ion-icon>
                  <ion-label>
                    {{ getBookmarkTitle(bookmark) }}
                  </ion-label>
                </ion-item>
              }
            </ion-menu-toggle>
          </ion-list>
        </ion-content>
      </ion-menu>

      <div class="ion-page" id="main-content">
        <ion-router-outlet [animation]="pageTurnAnimation"></ion-router-outlet>
      </div>
    </ion-split-pane>
  `,
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  // Injected services
  private readonly route = inject(ActivatedRoute);
  private readonly routerNavigationService = inject(RouterNavigationService);
  protected readonly bibleTranslation = inject(BibleTranslationService);
  protected readonly bookmarkService = inject(BookmarkService);
  protected readonly fragment = inject(StorageService).getSignal('routeFragment');

  // Properties
  protected readonly appPages = [
    { title: TextKey.Search, url: '/search', icon: 'search' },
    { title: TextKey.Read, url: '/read', icon: 'book' },
    { title: TextKey.Notes, url: '/notes', icon: 'document-text' },
    { title: TextKey.Highlights, url: '/highlights', icon: 'color-fill' },
    { title: TextKey.Tags, url: '/tags', icon: 'pricetag' },
    { title: TextKey.Settings, url: '/settings', icon: 'settings' },
  ];
  protected readonly TextKey = TextKey;

  // Signals
  protected routeFirstChildParams = toSignal(this.route.firstChild?.params!);
  protected getBookmarkTitle = BookmarkUtils.getTitle;
  protected getBookmarkVerses = (bookmark: BookmarkAnnotation) =>
    bookmark.targets.map((target) => target.verse).join(',');

  // Computed signals
  protected translation = computed(() => {
    const { translation } = this.routeFirstChildParams() ?? {};
    return translation || this.bibleTranslation.translation();
  });
  protected readonly recentReadBookName = computed(() => {
    const recentRead = this.bookmarkService.recentRead();
    return recentRead?.bookName ?? recentRead?.bookUsfm ?? '';
  });
  protected routeFirstChildData = computed(() => {
    this.routerNavigationService.navigationEnd();
    return this.route.snapshot.firstChild?.data;
  });
  pageTurnAnimation = slideAnimation;
}
