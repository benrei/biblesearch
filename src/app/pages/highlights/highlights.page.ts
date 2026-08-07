import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@angular-libs/translate';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { RainbowColors } from 'src/app/constants/colors';
import { TextKey } from 'src/app/constants/text-key';
import { HighlightAnnotation } from 'src/app/interfaces';
import { AnnotationService } from 'src/app/services/annotation.service';
import BookmarkUtils from 'src/app/utils/bookmark.utils';

@Component({
  selector: 'app-highlights',
  imports: [
    PageHeaderComponent,
    IonContent,
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonList,
    IonNote,
    DatePipe,
    RouterLink,
    TranslatePipe,
  ],
  template: `
    <app-page-header></app-page-header>
    <ion-content class="ion-padding">
      @if (!highlights().length) {
        <ion-note color="medium">{{ TextKey.NoHighlights | translate }}</ion-note>
      } @else {
        <ion-list>
          @for (highlight of highlights(); track highlight.id) {
            @let firstTarget = highlight.targets[0];
            <ion-item-sliding #sliding>
              <ion-item
                [button]="true"
                [routerLink]="[
                  '/read',
                  firstTarget.translation,
                  firstTarget.bookUsfm,
                  firstTarget.chapter,
                ]"
                [queryParams]="{ focusVerses: getVerses(highlight) }"
              >
                <div
                  class="color-swatch"
                  slot="start"
                  [style.background]="getColor(highlight.color)"
                ></div>
                <ion-label>
                  <div class="highlight-header">
                    <strong>{{ getTitle(highlight) }}</strong>
                    <ion-note color="medium">{{ highlight.createdAt | date: 'medium' }}</ion-note>
                  </div>
                  @if (firstTarget.quote) {
                    <ion-note color="medium">{{ firstTarget.quote }}</ion-note>
                  }
                </ion-label>
              </ion-item>
              <ion-item-options>
                <ion-item-option
                  color="danger"
                  (click)="deleteHighlight(highlight); sliding.close()"
                >
                  {{ TextKey.Delete | translate }}
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styleUrl: './highlights.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightsPage {
  private readonly annotations = inject(AnnotationService);

  protected readonly highlights = this.annotations.highlights;
  protected readonly TextKey = TextKey;
  protected readonly getTitle = BookmarkUtils.getTitle;

  protected getVerses(highlight: HighlightAnnotation): string {
    return highlight.targets.map((target) => target.verse).join(',');
  }

  protected getColor(color: string): string {
    return RainbowColors[color as keyof typeof RainbowColors] ?? color;
  }

  protected deleteHighlight(highlight: HighlightAnnotation): void {
    this.annotations.deleteAnnotation(highlight.id);
  }
}
