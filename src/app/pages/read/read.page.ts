import { bibleBooks } from './bibleBooks';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Sidebar } from 'primeng/sidebar';
import { Subscription } from 'rxjs';

@Component({
  templateUrl: './read.page.html',
  styleUrls: ['./read.page.css'],
})
export class ReadPage implements OnDestroy {
  items: MenuItem[];
  menuVisisble = false;
  events$: Subscription;
  title = 'Read';
  constructor(private route: ActivatedRoute, private router: Router) {
    this.items = [
      { label: 'Book', icon: 'pi pi-fw pi-book', routerLink: 'book' },
      { label: 'Book', icon: 'pi pi-fw pi-book', routerLink: 'book2' },
      // {
      //   label: 'Chapter',
      //   icon: 'pi pi-fw pi-align-left',
      //   routerLink: 'chapter',
      // }, // pi-bookmark
    ];
    this.events$ = this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.items = [];
        const route = this.route.snapshot;
        const { bibleTranslation } = route.params;
        if (bibleTranslation) {
          this.items.push({
            label: bibleTranslation.toUpperCase(),
            icon: 'pi pi-fw pi-book',
            routerLink: 'book',
          });
          this.title = 'Choose book';
        }
        if (route.firstChild) {
          const { book, chapter } = route.firstChild.params;
          const currentBook = bibleBooks.find((b) => b.id === book);
          if (book) {
            this.title = 'Choose chapter';
            this.items.push({
              label: currentBook?.name,
              icon: 'pi pi-fw pi-file',
              routerLink: book + '/chapter',
            });
          }
          if (chapter) {
            this.title = `${currentBook?.name} ${chapter}`;
            this.items.push({
              label: 'Chapter ' + chapter,
              icon: 'pi pi-fw pi-file',
            });
          }
        }
      }
    });
  }

  onMenuClick(sidebar: Sidebar) {
    this.menuVisisble = !sidebar.visible;
  }

  ngOnDestroy(): void {
    this.events$?.unsubscribe();
  }
}
