import { NoteModalService } from 'src/app/components/note-modal/note-modal.service';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { NoteAnnotation } from 'src/app/interfaces';
import BookmarkUtils from 'src/app/utils/bookmark.utils';
import { TextKey } from 'src/app/constants/text-key';
import { TranslatePipe } from '@angular-libs/translate';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { AnnotationService } from 'src/app/services/annotation.service';

@Component({
  selector: 'app-notes',
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
    TranslatePipe,
  ],
  template: `
    <app-page-header></app-page-header>
    <ion-content class="ion-padding">
      <ion-list>
        @for (note of notes(); track $index) {
          <ion-item-sliding #sliding>
            <ion-item [button]="true" (click)="onNoteClick(note)">
              <ion-label>
                <div class="note-header">
                  <strong>{{ getNoteTitle(note) }}</strong>
                  <ion-note color="medium">{{ note.createdAt | date: 'medium' }}</ion-note>
                </div>
                <ion-note color="medium">{{ note.content }}</ion-note>
              </ion-label>
            </ion-item>

            <ion-item-options>
              <ion-item-option color="danger" (click)="deleteNote(note); sliding.close()">{{
                TextKey.Delete | translate
              }}</ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        }
      </ion-list>
    </ion-content>
  `,
  styleUrl: './notes.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesPage {
  private annotations = inject(AnnotationService);
  protected notes = this.annotations.notes;
  protected selectedNote = signal<NoteAnnotation | undefined>(undefined);
  protected selectedNoteTitle = computed(() => BookmarkUtils.getTitle(this.selectedNote()));
  protected noteModalService = inject(NoteModalService);
  protected getNoteTitle = BookmarkUtils.getTitle;
  protected TextKey = TextKey;

  protected async onNoteClick(note: NoteAnnotation) {
    const modal = await this.noteModalService.openModal(note);
    await modal.onDidDismiss<NoteAnnotation>();
    this.selectedNote.set(undefined);
  }

  protected deleteNote(note: NoteAnnotation) {
    this.annotations.deleteAnnotation(note.id);
  }
}
