import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReadPage } from './read.page';
import { BookComponent } from './book/book.component';
import { ChapterComponent } from './chapter/chapter.component';
import { ReadMenuComponent } from './read-menu/read-menu.component';
import { ToolbarModule } from 'src/app/features/toolbar/toolbar.module';
import { SidebarModule } from 'primeng/sidebar';
import { TabMenuModule } from 'primeng/tabmenu';
import { VerseComponent } from './verse/verse.component';
import { ChaptersComponent } from './chapters/chapters.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';

const routes: Route[] = [
  // { path: '', pathMatch: 'full', redirectTo: 'book' },
  {
    component: ReadPage,
    path: ':bibleTranslation',
    children: [
      // {
      //   component: TranslationComponent,
      //   path: ':bibleTranslation',
      //   pathMatch: 'full',
      // },
      { path: '', pathMatch: 'full', redirectTo: 'book' },
      {
        component: BookComponent,
        path: 'book',
        pathMatch: 'full',
      },
      {
        component: BookComponent,
        path: ':book',
        pathMatch: 'full',
      },
      {
        component: ChaptersComponent,
        path: ':book/chapter',
        pathMatch: 'full',
      },
      {
        component: VerseComponent, // Text page
        path: ':book/:chapter',
        pathMatch: 'full',
      },
    ],
  },
];
@NgModule({
  declarations: [
    ReadPage,
    ChapterComponent,
    BookComponent,
    ReadMenuComponent,
    ChaptersComponent,
    VerseComponent,
  ],
  exports: [
    ReadPage,
    ChapterComponent,
    BookComponent,
    ReadMenuComponent,
    ChaptersComponent,
  ],
  imports: [
    BreadcrumbModule,
    CommonModule,
    RouterModule.forChild(routes),
    SidebarModule,
    TabMenuModule,
    ToolbarModule,
  ],
})
export class ReadModule {}
