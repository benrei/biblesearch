import { Component } from '@angular/core';
import { ThemeService } from './shared/themes.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(private themeService: ThemeService) {
    localStorage.getItem('darkMode') === 'true'
      ? this.themeService.switchTheme('md-dark-indigo')
      : this.themeService.switchTheme('md-light-indigo');
  }
}
