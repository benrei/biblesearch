import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonAccordion,
  IonAccordionGroup,
  IonBadge,
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
} from '@ionic/angular/standalone';
import { ALTranslate, TranslatePipe } from '@angular-libs/translate';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { TextKey } from 'src/app/constants/text-key';
import { TagAnnotation, TagDefinition } from 'src/app/interfaces';
import { AnnotationService } from 'src/app/services/annotation.service';
import BookmarkUtils from 'src/app/utils/bookmark.utils';

@Component({
  selector: 'app-tags',
  imports: [
    PageHeaderComponent,
    IonAccordion,
    IonAccordionGroup,
    IonBadge,
    IonButton,
    IonContent,
    IonIcon,
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonList,
    IonNote,
    RouterLink,
    TranslatePipe,
  ],
  template: `
    <app-page-header></app-page-header>
    <ion-content class="ion-padding">
      @if (!tagGroups().length) {
        <div class="empty-state">
          <ion-icon name="pricetag-outline"></ion-icon>
          <ion-note color="medium">{{ TextKey.NoTags | translate }}</ion-note>
        </div>
      } @else {
        <ion-accordion-group [multiple]="true">
          @for (group of tagGroups(); track group.tag.id) {
            <ion-accordion [value]="tagValue(group.tag.id)">
              <ion-item slot="header" class="tag-header" lines="full">
                <ion-icon name="pricetag-outline" slot="start" class="tag-icon"></ion-icon>
                <ion-label>
                  <h2 class="tag-name">{{ group.tag.name }}</h2>
                </ion-label>
                <ion-button
                  slot="end"
                  fill="clear"
                  color="medium"
                  class="delete-tag-button"
                  [attr.aria-label]="TextKey.DeleteTag | translate"
                  (click)="onDeleteTagClick($event, group.tag)"
                >
                  <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                </ion-button>
                <ion-badge slot="end" class="count-badge">{{ group.annotations.length }}</ion-badge>
              </ion-item>

              <div class="tag-content" slot="content">
                <ion-list lines="full">
                  @if (!group.annotations.length) {
                    <ion-item lines="none">
                      <ion-note color="medium">{{ TextKey.NoTaggedVerses | translate }}</ion-note>
                    </ion-item>
                  } @else {
                    @for (annotation of group.annotations; track annotation.id) {
                      @let firstTarget = annotation.targets[0];
                      <ion-item-sliding #verseSliding (mousedown)="$event.preventDefault()">
                        <ion-item
                          [button]="true"
                          detail="true"
                          [routerLink]="[
                            '/read',
                            firstTarget.translation,
                            firstTarget.bookUsfm,
                            firstTarget.chapter,
                          ]"
                          [queryParams]="{ focusVerses: getVerses(annotation) }"
                        >
                          <ion-icon name="book-outline" slot="start" class="verse-icon"></ion-icon>
                          <ion-label>
                            <h2>{{ getTitle(annotation) }}</h2>
                            @if (firstTarget.quote) {
                              <p class="verse-quote">{{ firstTarget.quote }}</p>
                            }
                          </ion-label>
                        </ion-item>
                        <ion-item-options>
                          <ion-item-option
                            color="danger"
                            (click)="
                              removeTagFromVerse(annotation, group.tag.id); verseSliding.close()
                            "
                          >
                            {{ TextKey.Delete | translate }}
                          </ion-item-option>
                        </ion-item-options>
                      </ion-item-sliding>
                    }
                  }
                </ion-list>
              </div>
            </ion-accordion>
          }
        </ion-accordion-group>
      }
    </ion-content>
  `,
  styleUrl: './tags.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagsPage {
  private readonly annotations = inject(AnnotationService);
  private readonly alertController = inject(AlertController);
  private readonly translation = inject(ALTranslate);

  protected readonly TextKey = TextKey;
  protected readonly getTitle = BookmarkUtils.getTitle;

  protected readonly tagGroups = computed(() =>
    this.annotations
      .tagDefinitions()
      .map((tag) => ({
        tag,
        annotations: this.annotations.getAnnotationsForTag(tag.id),
      }))
      .sort((a, b) => a.tag.name.localeCompare(b.tag.name)),
  );

  protected tagValue(tagId: number): string {
    return String(tagId);
  }

  protected getVerses(annotation: TagAnnotation): string {
    return annotation.targets.map((target) => target.verse).join(',');
  }

  protected removeTagFromVerse(annotation: TagAnnotation, tagId: number): void {
    this.annotations.removeTagFromAnnotation(annotation.id, tagId);
  }

  protected onDeleteTagClick(event: Event, tag: TagDefinition): void {
    event.stopPropagation();
    void this.confirmDeleteTag(tag);
  }

  protected async confirmDeleteTag(tag: TagDefinition): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translation.get(TextKey.DeleteTag),
      message: this.translation.get(TextKey.DeleteTagMessage),
      buttons: [
        { text: this.translation.get(TextKey.Cancel), role: 'cancel' },
        {
          text: this.translation.get(TextKey.Delete),
          role: 'destructive',
          handler: () => this.annotations.deleteTagDefinition(tag.id),
        },
      ],
    });
    await alert.present();
  }
}
