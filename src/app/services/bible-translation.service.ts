import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BibleTranslation, translations } from '../constants/translations';
import { UrlPath } from '../constants/url-path';
import { RouterNavigationService } from './router-navigation.service';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class BibleTranslationService {
  private router = inject(Router);
  private routerNavigationService = inject(RouterNavigationService);
  private storage = inject(StorageService);

  translations = signal<BibleTranslation[]>(translations);

  readonly translation = computed(() => {
    const url = this.routerNavigationService.navigationEnd()?.url;
    if (url) {
      const urlTree = this.router.parseUrl(url);
      const segments = urlTree.root.children['primary']?.segments || [];
      if (segments[0]?.path === UrlPath.read && segments[1]) {
        return segments[1].path;
      }
    }
    return this.storage.getSignal('translation')();
  });

  constructor() {
    effect(() => {
      this.storage.set('translation', this.translation());
    });
  }

  public getTranslationObj(translationUsfm: string) {
    return translations.find((t) => t.usfm === translationUsfm);
  }

  public updateTranslation(newTranslation: string): void {
    const urlTree = this.router.parseUrl(this.router.url);
    const segments = urlTree.root.children['primary']?.segments || [];
    if (segments[0]?.path === UrlPath.read) {
      const currentTranslation = segments.length > 1 ? segments[1].path : null;
      if (newTranslation === currentTranslation) return;
      const newSegments = [UrlPath.read, newTranslation, ...segments.slice(2).map((s) => s.path)];
      const { queryParams } = urlTree;
      const fragment = urlTree.fragment || undefined;
      this.router.navigate(newSegments, { queryParams, fragment });
    } else {
      if (newTranslation === this.translation()) return;
      this.storage.set('translation', newTranslation);
      if (urlTree.queryParams['translations']) {
        const { translations: _, ...restQueryParams } = urlTree.queryParams;
        this.router.navigate([], {
          queryParams: restQueryParams,
          replaceUrl: true,
        });
      }
    }
  }
}
