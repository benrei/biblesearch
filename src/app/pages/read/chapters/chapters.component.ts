import { bibleBooks } from './../bibleBooks';
import { ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-chapters',
  templateUrl: './chapters.component.html',
  styleUrls: ['./chapters.component.scss'],
})
export class ChaptersComponent {
  chapters: number[] = [];

  constructor(private route: ActivatedRoute) {
    const { book } = this.route.snapshot.params;
    const curentBook = bibleBooks.find((b) => b.id === book);
    if (curentBook) {
      for (let index = 1; index <= curentBook.chapters; index++) {
        this.chapters.push(index);
      }
    }
  }
}
