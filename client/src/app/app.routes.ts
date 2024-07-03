import { Routes } from '@angular/router';
import { SearchPage } from './pages/search/search.page';
import { BooksPage } from './pages/read/books/books.page';
import { ChaptersPage } from './pages/read/chapters/chapters.page';
import { VersesPage } from './pages/read/verses/verses.page';
import { SettingsPage } from './pages/settings/settings.page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'search',
    pathMatch: 'full',
  },
  {
    path: 'search',
    component: SearchPage,
  },
  {
    path: 'read',
    pathMatch: 'full',
    component: BooksPage,
  },
  {
    path: 'read/:book',
    pathMatch: 'full',
    component: ChaptersPage,
  },
  {
    path: 'read/:book/:chapter',
    pathMatch: 'full',
    component: VersesPage,
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.page').then((m) => m.SettingsPage),
  },
];
