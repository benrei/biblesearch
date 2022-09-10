import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AppService } from 'src/app/app.service';
const bibleTranslation = localStorage.getItem('bible_translation') || 'kjv';
@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent {
  menuVisible = false;
  items: MenuItem[] = [
    { label: 'Search', routerLink: '/search' },
    { label: 'Read', routerLink: `/read/${bibleTranslation}` },
    { label: 'Settings', routerLink: '/settings' },
    { label: 'About', routerLink: '/about' },
  ];
  constructor(public appService: AppService) {
    this.appService.menuVisible$.subscribe((visible) => {
      this.menuVisible = visible;
    });
    this.items.forEach((i) => {
      i.command = () => this.appService.menuVisible$.next(false);
    });
  }
  onHide() {
    if (this.appService.menuVisible$.value) {
      this.appService.menuVisible$.next(false);
    }
  }
}
