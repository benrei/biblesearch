import { Route, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReadPage } from './read.page';
import { BookComponent } from './book/book.component';
import { ChapterComponent } from './chapter/chapter.component';
import { TranslationComponent } from './translation/translation.component';
import { ReadMenuComponent } from './read-menu/read-menu.component';

const routes: Route[] = [
  { path: '', pathMatch: 'full', component: ReadPage },
  {
    path: ':translation',
    component: TranslationComponent,
    // pathMatch: 'full',
  },
  {
    path: ':translation/:book',
    component: BookComponent,
    // pathMatch: 'full',
  },
  {
    path: ':translation/:book/:chapter',
    component: ChapterComponent,
  },
];
@NgModule({
  declarations: [ReadPage, ChapterComponent, BookComponent, ReadMenuComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class ReadModule {}
