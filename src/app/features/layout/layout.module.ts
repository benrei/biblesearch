import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from './main-layout.component';
import { ToolbarModule } from '../toolbar/toolbar.module';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MenuModule } from '../menu/menu.module';

@NgModule({
  declarations: [MainLayoutComponent],
  imports: [
    CommonModule,
    MatSidenavModule,
    MenuModule,
    RouterModule,
    ToolbarModule,
  ],
})
export class LayoutModule {}
