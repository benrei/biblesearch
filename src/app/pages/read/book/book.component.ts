import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css'],
})
export class BookComponent implements OnInit {
  constructor() {
    console.log('BookComponent');
  }

  ngOnInit(): void {}
}
