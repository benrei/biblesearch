import { Routes } from '@angular/router';
import { SearchPage } from './pages/search/search.page';
import { BooksPage } from './pages/read/books/books.page';
import { ChaptersPage } from './pages/read/chapters/chapters.page';
import { VersesPage } from './pages/read/verses/verses.page';
import { SettingsPage } from './pages/settings/settings.page';
import { NotesPage } from './pages/notes/notes.page';
import { LayoutComponent } from './components/layout/layout.component';
import RouteUtils from './utils/route.utils';
import { TextKey } from './constants/text-key';
import { UrlPath } from './constants/url-path';

export const routes: Routes = [
  {
    path: '',
    redirectTo: RouteUtils.redirectPathRoot,
    pathMatch: 'full',
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: UrlPath.search,
        component: SearchPage,
        data: { enableTranslationsSelect: true, title: TextKey.Search },
      },
      {
        path: UrlPath.read,
        pathMatch: 'full',
        redirectTo: RouteUtils.redirectPathRead,
      },
      {
        path: `${UrlPath.read}/:translation`,
        pathMatch: 'full',
        component: BooksPage,
        data: { enableTranslationsSelect: true, title: TextKey.Books },
      },
      {
        path: `${UrlPath.read}/:translation/:bookUsfm`,
        pathMatch: 'full',
        component: ChaptersPage,
        data: { enableTranslationsSelect: true },
        resolve: {
          title: RouteUtils.getChapterPageTitle,
        },
      },
      {
        path: `${UrlPath.read}/:translation/:bookUsfm/:chapter`,
        pathMatch: 'full',
        component: VersesPage,
        data: { enableTranslationsSelect: true },
        resolve: {
          title: RouteUtils.getVersePageTitle,
        },
      },
      {
        path: UrlPath.settings,
        component: SettingsPage,
        data: { title: TextKey.Settings },
      },
      {
        path: UrlPath.notes,
        component: NotesPage,
        data: { title: TextKey.Notes },
      },
    ],
  },
];
