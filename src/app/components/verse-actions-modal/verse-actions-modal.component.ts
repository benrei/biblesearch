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
import { ApiService } from 'src/app/services/api.service';
import { AnnotationService } from 'src/app/services/annotation.service';
import { NoteModalService } from '../note-modal/note-modal.service';
import { RainbowColor, RainbowColors } from './../../constants/colors';

@Component({
  selector: 'app-verse-actions-modal',
  imports: [IonButton, IonIcon, IonItem, IonLabel, IonList, IonRadio, IonRadioGroup, TranslatePipe],
  template: `
    <ion-list>
      <ion-item [button]="true" (click)="onActionClick('copyText')">
        <ion-icon name="copy-outline" slot="start"></ion-icon>
        <ion-label>{{ TextKey.CopyText | translate }}</ion-label>
      </ion-item>
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
  private apiService = inject(ApiService);
  private modalController = inject(ModalController);
  private noteModalService = inject(NoteModalService);

  ngOnInit(): void {
    this.color = this.annotations.getHighlightColor(this.selection);
  }

  protected async onActionClick(role: string, data?: string) {
    switch (role) {
      case 'copyText': {
        let targets = this.selection.targets;
        if (targets.length) {
          const missingQuote = targets.some((t) => !t.quote);
          if (missingQuote) {
            const first = targets[0];
            try {
              const allVerses = await this.apiService.getVerses(
                first.translation,
                first.bookUsfm,
                first.chapter,
              );
              const verseMap = new Map(allVerses.map((v) => [v.verse, v.text]));
              targets = targets.map((t) => ({
                ...t,
                quote: t.quote || verseMap.get(t.verse) || '',
              }));
            } catch {
              // Ignore fetch errors
            }
          }

          const first = targets[0];
          const verseNumbers = targets.map((t) => t.verse);
          const verseRef = formatVerseRange(verseNumbers);
          const combinedText = targets.map((t) => t.quote?.trim()).filter(Boolean).join(' ');
          const formattedOutput = `"${combinedText}" - ${first.bookName} ${first.chapter}:${verseRef} (${first.translation})`;

          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(formattedOutput);
          } else {
            const textArea = document.createElement('textarea');
            textArea.value = formattedOutput;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
          }
        }
        break;
      }
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

function formatVerseRange(verses: number[]): string {
  if (!verses.length) return '';
  const sorted = [...new Set(verses)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
}
