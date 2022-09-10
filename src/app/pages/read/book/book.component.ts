import { Component, OnInit } from '@angular/core';
import { bibleBooks } from '../bibleBooks';

@Component({
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css'],
})
export class BookComponent implements OnInit {
  books = bibleBooks;
  constructor() {}

  ngOnInit(): void {}
}
