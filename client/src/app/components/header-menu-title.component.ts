import { Component, Input } from '@angular/core';
import { IonButtons, IonMenuButton, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-header-menu-title',
  standalone: true,
  imports: [IonTitle, IonButtons, IonMenuButton],
  template: `
    <div class="toolbar-with-search">
      <ion-title>{{ titleText }}</ion-title>
      <ion-buttons slot="end" [collapse]="true">
        <ion-menu-button auto-hide="true"></ion-menu-button>
      </ion-buttons>
    </div>
  `,
})
export class HeaderMenuTitleComponent {
  @Input() titleText = 'Title';
}
