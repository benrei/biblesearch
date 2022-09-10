import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  templateUrl: './chapter.component.html',
  styleUrls: ['./chapter.component.scss'],
})
export class ChapterComponent {
  bibleVerses: BibleVerse[] = [];
  constructor(
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {
    const path = this.router.url;
    const queryValues = path.substring(6).split('/');
    console.log(queryValues);
    const query = {
      translation_id: queryValues[0],
      book_id: queryValues[1],
      chapter: queryValues[2],
    };
    const urlSearchParams = new URLSearchParams(query).toString();

    const url =
      'https://westeurope.azure.data.mongodb-api.com/app/biblesearchapp-ooywx/endpoint/chapter?';
    this.http.get(url + urlSearchParams).subscribe((res) => {
      this.bibleVerses = res as BibleVerse[];

      setTimeout(() => {
        const { queryParams } = this.activatedRoute.snapshot;
        console.log(queryParams);
        const id = `verse_${queryParams['verse']}`;
        console.log(id);
        const element = document.getElementById(id);
        console.log(element);
        element?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      });
    });
  }

  onVerseClick(event: any) {
    event.target.parentElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
  }
}
interface BibleVerse {
  _id?: string;
  book_id?: string;
  book_name?: string;
  chapter?: number;
  text?: string;
  translation_id?: string;
  verse?: number;
}
