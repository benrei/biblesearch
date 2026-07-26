import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRadio,
  IonRadioGroup,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@angular-libs/translate';
import { QueryParam } from 'src/app/constants/query-param';
import { TextKey } from 'src/app/constants/text-key';
import { VerseSelection } from 'src/app/interfaces';
import { AnnotationService } from 'src/app/services/annotation.service';
import { NoteModalService } from '../note-modal/note-modal.service';
import { RainbowColor, RainbowColors } from './../../constants/colors';

@Component({
  selector: 'app-verse-actions-modal',
  imports: [IonButton, IonIcon, IonItem, IonLabel, IonList, IonRadio, IonRadioGroup, TranslatePipe],
  template: `
    <ion-list>
      <ion-item [button]="true" (click)="onActionClick('note')">
        <ion-icon name="document-text-outline" slot="start"></ion-icon>
        <ion-label>{{ TextKey.AddNote | translate }}</ion-label>
      </ion-item>
      <ion-item [button]="true" (click)="onActionClick('bookmark')">
        <ion-icon name="bookmark-outline" slot="start"></ion-icon>
        <ion-label>{{ TextKey.Bookmark | translate }}</ion-label>
      </ion-item>
      <ion-item [button]="true" (click)="onActionClick('share')">
        <ion-icon name="share-social-outline" slot="start"></ion-icon>
        <ion-label>{{ TextKey.CopyLink | translate }}</ion-label>
      </ion-item>
      <ion-item>
        <ion-radio-group
          [value]="color"
          (ionChange)="onActionClick('highlight', $any($event).target.value)"
        >
          <div>
            <ion-radio class="red" [value]="RainbowColor.red"></ion-radio>
            <ion-radio class="orange" [value]="RainbowColor.orange"></ion-radio>
            <ion-radio class="yellow" [value]="RainbowColor.yellow"></ion-radio>
            <ion-radio class="green" [value]="RainbowColor.green"></ion-radio>
            <ion-radio class="blue" [value]="RainbowColor.blue"></ion-radio>
            <ion-radio class="indigo" [value]="RainbowColor.indigo"></ion-radio>
            <ion-radio class="violet" [value]="RainbowColor.violet"></ion-radio>
            <ion-radio class="white" value="white"></ion-radio>
            <ion-radio class="gray" value="gray"></ion-radio>
            <ion-button
              color="medium"
              shape="round"
              size="medium"
              (click)="onActionClick('highlight', undefined)"
            >
              <ion-icon slot="icon-only" name="close-circle"></ion-icon>
            </ion-button>
          </div>
        </ion-radio-group>
      </ion-item>
    </ion-list>
  `,
  styleUrl: './verse-actions-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerseActionsModalComponent implements OnInit, VerseActionsModalProps {
  selection!: VerseSelection;
  protected color?: string;
  protected RainbowColors = RainbowColors;
  protected RainbowColor = RainbowColor;
  protected TextKey = TextKey;

  private annotations = inject(AnnotationService);
  private modalController = inject(ModalController);
  private noteModalService = inject(NoteModalService);

  ngOnInit(): void {
    this.color = this.annotations.getHighlightColor(this.selection);
  }

  protected async onActionClick(role: string, data?: string) {
    switch (role) {
      case 'share':
        const verseQueryParam = this.selection.targets.map((target) => target.verse).join(',');

        // Ensure query params are properly placed before the hash fragment
        const urlObj = new URL(window.location.href);
        urlObj.searchParams.set(QueryParam.FocusVerses, verseQueryParam);
        const url = urlObj.toString();

        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
        }
        break;
      case 'note':
        const note = this.annotations.createNote(this.selection.targets);
        const modal = await this.noteModalService.openModal(note);
        modal.onDidDismiss().then((event) => {
          event.role === 'save' ? this.modalController.dismiss(event.data, role) : null;
        });
        return;
      case 'highlight':
        this.color = data;
        this.annotations.saveHighlight(this.selection, this.color ?? '');
        break;
      case 'bookmark':
        this.annotations.saveBookmark(this.selection.targets);
        break;
    }
    this.modalController.dismiss(data, role);
  }
}

interface VerseActionsModalProps {
  selection: VerseSelection;
}
