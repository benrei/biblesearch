import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { books } from 'src/app/constants/books-chapters';

@Component({
  selector: 'app-chapters',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    RouterLink,
  ],
  template: `
    <ion-header collapse="fade">
      <ion-toolbar>
        <ion-title>Chapters</ion-title>
        <ion-buttons slot="start" [collapse]="true">
          <ion-back-button></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content [fullscreen]="true" class="ion-padding">
      <div class="grid-container">
        @for (chapter of chapters; track chapter) {
        <a [routerLink]="['/read', bookId, chapter]">
          <div class="grid-item">{{ chapter }}</div>
        </a>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      :host {
        margin: auto;
        max-width: var(--content-max-width);
      }
      .grid-container {
        /* background-color: #2196F3; */
        display: grid;
        gap: 8px;
        grid-template-columns: auto auto auto auto auto;
        padding: 10px;
      }
      .grid-container > a {
        text-decoration: none;
        color: inherit;
      }
      .grid-item {
        aspect-ratio: 1 / 1;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(0, 0, 0, 0.5);
        border-radius: 8px;
        display: flex;
        font-size: 30px;
        justify-content: center;
      }
    `,
  ],
})
export class ChaptersPage {
  bookId: number;
  books = books;
  chapters: number[] = [];

  constructor(private activatedRoute: ActivatedRoute) {
    this.bookId = Number(this.activatedRoute.snapshot.paramMap.get('book'));
    const { chapters } = books.find((b) => b.id === this.bookId) || {};
    if (!chapters) return;
    this.chapters = Array.from({ length: chapters }, (_, index) => index + 1);
  }
}
