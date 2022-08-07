import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: './translation.component.html',
  styleUrls: ['./translation.component.css'],
})
export class TranslationComponent implements OnInit {
  constructor() {
    console.log('TranslationComponent');
  }

  ngOnInit(): void {}
}
