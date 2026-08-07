import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AlertController,
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonRadio,
  IonRadioGroup,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { ALTranslate, TranslatePipe } from '@angular-libs/translate';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { languages } from 'src/app/constants/languages';
import { TextKey } from './../../constants/text-key';
import { SettingsAppearanceComponent } from 'src/app/components/settings-appearance/settings-appearance.component';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { StorageService } from 'src/app/services/storage.service';
import { StudyDataBackupService } from 'src/app/services/study-data-backup.service';

@Component({
  selector: 'app-settings',
  imports: [
    PageHeaderComponent,
    SettingsAppearanceComponent,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonRadio,
    IonRadioGroup,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <app-page-header></app-page-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-list-header>
          <ion-label>{{ TextKey.StartPage | translate }}</ion-label>
        </ion-list-header>
        <ion-item>
          <ion-radio-group
            title="Start page"
            [value]="startPage()"
            (ionChange)="storage.set('startPage', $event.detail.value)"
          >
            <ion-radio value="search">{{ TextKey.Search | translate }}</ion-radio>
            <ion-radio value="read">{{ TextKey.Read | translate }}</ion-radio>
            <ion-radio value="recentRead">{{ TextKey.RecentRead | translate }}</ion-radio>
          </ion-radio-group>
        </ion-item>
        <ion-list-header>
          <ion-label> {{ TextKey.Language | translate }}</ion-label>
        </ion-list-header>
        <ion-item>
          <ion-select
            interface="popover"
            [value]="language()"
            (ionChange)="
              storage.set('language', $event.detail.value);
              userSettings.setLanguage($event.detail.value)
            "
          >
            @for (language of languages(); track language.value) {
              <ion-select-option [value]="language.value">
                {{ language.description }}
              </ion-select-option>
            }
          </ion-select>
        </ion-item>
        <ion-list-header>
          <ion-label>{{ TextKey.BookmarkSettings | translate }}</ion-label>
        </ion-list-header>
        <ion-item>
          <ion-input
            label="{{ TextKey.NumberOfBookmarks | translate }}"
            labelPlacement="stacked"
            [clearInput]="true"
            placeholder="Default: 5"
            type="number"
            [value]="bookmarksLimit()"
            (ionChange)="storage.set('bookmarksLimit', +$event.detail.value!)"
          >
          </ion-input>
        </ion-item>
        <ion-list-header>
          <ion-label>{{ TextKey.StudyData | translate }}</ion-label>
        </ion-list-header>
        <ion-item>
          <ion-button expand="block" (click)="backup.downloadExport()">
            {{ TextKey.ExportStudyData | translate }}
          </ion-button>
        </ion-item>
        <ion-item>
          <ion-button expand="block" fill="outline" (click)="fileInput.click()">
            {{ TextKey.ImportStudyData | translate }}
          </ion-button>
          <input
            #fileInput
            hidden
            type="file"
            accept="application/json,.json"
            (change)="onImportFile($event)"
          />
        </ion-item>
      </ion-list>
      <app-settings-appearance></app-settings-appearance>
    </ion-content>
  `,
})
export class SettingsPage {
  protected storage = inject(StorageService);
  protected userSettings = inject(UserSettingsService);
  protected backup = inject(StudyDataBackupService);
  private alertController = inject(AlertController);
  private translation = inject(ALTranslate);

  bookmarksLimit = this.storage.getSignal('bookmarksLimit');
  language = this.storage.getSignal('language');
  languages = signal(languages);
  startPage = this.storage.getSignal('startPage');

  protected TextKey = TextKey;

  protected async onImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const raw = await file.text();
    const alert = await this.alertController.create({
      header: this.translation.get(TextKey.ImportStudyData),
      buttons: [
        { text: this.translation.get(TextKey.Cancel), role: 'cancel' },
        {
          text: this.translation.get(TextKey.ImportMerge),
          handler: () => this.backup.importJson(raw, 'merge'),
        },
        {
          text: this.translation.get(TextKey.ImportReplace),
          role: 'destructive',
          handler: () => this.backup.importJson(raw, 'replace'),
        },
      ],
    });
    await alert.present();
  }
}
