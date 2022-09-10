import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchPage } from './search.page';
import { RouterModule, Routes } from '@angular/router';
import { CardModule } from 'primeng/card';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SidebarModule } from 'primeng/sidebar';
import { ToolbarModule } from 'src/app/features/toolbar/toolbar.module';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

const routes: Routes = [{ path: '', component: SearchPage, children: [] }];

@NgModule({
  declarations: [SearchPage],
  imports: [
    CardModule,
    CommonModule,
    OverlayPanelModule,
    ProgressSpinnerModule,
    RouterModule.forChild(routes),
    ScrollPanelModule,
    SidebarModule,
    ToolbarModule,
  ],
})
export class SearchModule {}
