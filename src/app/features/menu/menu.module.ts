import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent } from './menu.component';
import { RouterModule } from '@angular/router';
import { MenuModule as PMenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';

@NgModule({
  declarations: [MenuComponent],
  exports: [MenuComponent],
  imports: [CommonModule, PMenuModule, RouterModule, SidebarModule],
})
export class MenuModule {}
