import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonList,
  IonSearchbar,
  IonContent,
  IonItem,
  IonLabel,
  IonToolbar,
  IonHeader,
  IonBackButton,
} from '@ionic/angular/standalone';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { HeaderMenuTitleComponent } from 'src/app/components/header-menu-title.component';
import { HighlightPipe } from 'src/app/pipes/highlight.pipe';
import { ApiService } from 'src/app/services/api.service';

@Component({
  standalone: true,
  imports: [
    HighlightPipe,
    IonLabel,
    IonItem,
    IonBackButton,
    IonHeader,
    IonToolbar,
    IonContent,
    CommonModule,
    IonSearchbar,
    IonList,
    RouterLink,
    HeaderMenuTitleComponent,
  ],
  styleUrl: './search.page.css',
  templateUrl: './search.page.html',
})
export class SearchPage {
  searchResults: any[] = [];
  private searchTerms = new Subject<string>();
  searchTerm = '';

  constructor(private apiService: ApiService) {
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term: string) => this.apiService.search(term))
      )
      .subscribe((results) => {
        this.searchResults = results;
      });
  }

  onSearchInput(event: any) {
    this.searchTerm = event.target.value.trim();
    if (this.searchTerm) {
      this.searchTerms.next(this.searchTerm);
    } else {
      this.searchResults = [];
    }
  }
}
