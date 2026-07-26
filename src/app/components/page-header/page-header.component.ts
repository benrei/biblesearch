import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  IonButtons,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@angular-libs/translate';

@Component({
  selector: 'app-page-header',
  imports: [IonButtons, IonMenuButton, IonHeader, IonToolbar, IonTitle, TranslatePipe],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title() | translate }} </ion-title>
        <ng-content select="[toolbarStart]"></ng-content>
        <ion-buttons slot="start" [collapse]="true">
          <ng-content select="[toolbarButton]"></ng-content>
        </ion-buttons>
        <ion-buttons slot="end" [collapse]="true">
          <ng-content select="[toolbarEnd]"></ng-content>
          <ion-menu-button auto-hide="true"></ion-menu-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  private route = inject(ActivatedRoute);
  routeData = toSignal(this.route.data);

  toolbarTitle = input<string>();
  title = computed(() => {
    // If the toolbarTitle input is provided, use it. Otherwise, use the route data title.
    return this.toolbarTitle() !== undefined ? this.toolbarTitle() : this.routeData()?.['title'];
  });
}
