import { Component } from '@angular/core';
import { ThemeService } from 'src/app/shared/themes.service';

@Component({
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.css'],
})
export class SettingsPage {
  darkMode = localStorage.getItem('darkMode') === 'true' ? true : false;
  constructor(private themeService: ThemeService) {}

  onThemeChange({ checked }: any) {
    checked
      ? this.themeService.switchTheme('md-dark-indigo')
      : this.themeService.switchTheme('md-light-indigo');
    localStorage.setItem('darkMode', checked);
  }
}
