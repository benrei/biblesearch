import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonNote,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonRouterLink,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronForwardOutline,
  searchOutline,
  searchSharp,
  bookOutline,
  bookSharp,
  bookmarkOutline,
  bookmarkSharp,
  settingsOutline,
  settingsSharp,
  timeOutline,
  timeSharp,
} from 'ionicons/icons';
import { BookmarkService } from './services/bookmark.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterLink,
    IonRouterOutlet,
  ],
})
export class AppComponent {
  public appPages = [
    { title: 'Search', url: '/search', icon: 'search' },
    { title: 'Read', url: '/read', icon: 'book' },
    // { title: 'Settings', url: '/settings', icon: 'settings' },
  ];
  public labels = [
    'Genesis 1',
    'Acts 2',
    'Hebrews 11',
    '1 John 1',
    '1 Peter 2',
    'Revelation 22',
  ];
  constructor(public bookmarkService: BookmarkService) {
    addIcons({
      chevronBackOutline,
      chevronForwardOutline,
      searchOutline,
      searchSharp,
      bookOutline,
      bookSharp,
      bookmarkOutline,
      bookmarkSharp,
      timeOutline,
      timeSharp,
      settingsOutline,
      settingsSharp,
    });
  }
}
