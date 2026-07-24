import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { IonApp } from '@ionic/angular/standalone';
import { initializeAppIcons } from './app.icons';
import { InitialTranslationLoaderComponent } from './components/initial-translation-loader/initial-translation-loader.component';
import { UserSettingsService } from './services/user-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [InitialTranslationLoaderComponent, IonApp, RouterOutlet],
})
export class AppComponent {
  private userSettings = inject(UserSettingsService);
  private swUpdate = inject(SwUpdate);

  constructor() {
    initializeAppIcons();
    this.userSettings.initSettings();
    this.setupServiceWorkerUpdates();
  }

  private setupServiceWorkerUpdates(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.subscribe((evt) => {
      if (evt.type === 'VERSION_READY') {
        this.swUpdate.activateUpdate().then(() => document.location.reload());
      }
    });

    this.swUpdate.unrecoverable.subscribe(() => {
      document.location.reload();
    });
  }
}
    