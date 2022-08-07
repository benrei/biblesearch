import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchPage } from './search.page';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [{ path: '', component: SearchPage, children: [] }];

@NgModule({
  declarations: [SearchPage],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class SearchModule {}
