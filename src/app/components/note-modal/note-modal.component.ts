import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { ALTranslate } from '@angular-libs/translate';
import { TextKey } from 'src/app/constants/text-key';
import { NoteAnnotation } from 'src/app/interfaces';
import { AnnotationService } from 'src/app/services/annotation.service';
import BookmarkUtils from 'src/app/utils/bookmark.utils';

@Component({
  selector: 'app-note-modal',
  imports: [IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonToolbar, IonTitle],
  template: `
    <ion-header collapse="fade">
      <ion-toolbar>
        <ion-title> {{ title }} </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="navigateToBookmark()">
            <ion-icon name="book-outline" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button (click)="onDeleteNote()">
            <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button (click)="onSave()">
            <ion-icon name="save-outline" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button (click)="modalController.dismiss()">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="note-modal-content">
        <textarea [value]="note.content" (input)="onNoteInput($event)"></textarea>
      </div>
    </ion-content>
  `,
  styleUrl: './note-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteModalComponent implements OnInit, NoteModalProps {
  private alertController = inject(AlertController);
  private router = inject(Router);
  private translation = inject(ALTranslate);
  private annotations = inject(AnnotationService);

  note!: NoteAnnotation;

  noteContent = signal<string | undefined>(this.note?.content);

  elRef = inject(ElementRef);
  title?: string;

  protected modalController = inject(ModalController);
  protected TextKey = TextKey;

  ngOnInit(): void {
    this.title = BookmarkUtils.getTitle(this.note);
  }

  protected async onDeleteNote() {
    const alert = await this.alertController.create({
      header: this.translation.get(TextKey.DeleteNote),
      message: this.translation.get(TextKey.DeleteNoteMessage),
      buttons: [
        {
          text: this.translation.get(TextKey.Cancel),
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: this.translation.get(TextKey.Delete),
          role: 'destructive',
          handler: () => {
            this.deleteNote(this.note);
            this.modalController.dismiss(this.note, 'delete');
          },
        },
      ],
    });
    alert.present();
  }

  protected navigateToBookmark() {
    const firstTarget = this.note.targets[0];
    const verses = this.note.targets.map((target) => target.verse);
    this.modalController.dismiss();
    this.router.navigate(
      [`/read/${firstTarget.translation}/${firstTarget.bookUsfm}/${firstTarget.chapter}`],
      {
      queryParams: { verse: verses.join(',') },
      },
    );
  }

  protected onSave() {
    if (this.note) {
      this.note.content = this.noteContent() ?? '';
      this.annotations.save(this.note);
    }

    this.modalController.dismiss(this.note, 'save');
  }

  protected onNoteInput(event: Event) {
    const element = event.target as HTMLTextAreaElement;
    this.noteContent.set(element.value);
  }

  protected deleteNote(note: NoteAnnotation) {
    this.annotations.deleteAnnotation(note.id);
  }
}

interface NoteModalProps {
  note: NoteAnnotation;
}
