import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { searchResult } from './data';
let timer: any;

@Component({
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {
  constructor(private http: HttpClient, private router: Router) {}
  searchResult: SearchResult[] = [];
  hasHighlights = false;

  ngOnInit(): void {}

  onSearch(event: any) {
    const term = event.target.value;
    clearTimeout(timer);
    timer = setTimeout(() => {
      // this.router.navigate([], { queryParams: { term } });
      const url =
        'https://westeurope.azure.data.mongodb-api.com/app/biblesearchapp-ooywx/endpoint/bibleSearch';
      this.http.get(`${url}?term=${term}`).subscribe((res) => {
        const searchResults = res as SearchResult[];
        this.searchResult = searchResults;
      });
    }, 500);
  }
}

interface SearchResult {
  _id?: string;
  chapter?: number;
  verse?: number;
  text?: number;
  translation_id?: number;
  book_id?: number;
  book_name?: number;
  score?: number;
  highlights?: {
    score?: number;
    path?: string;
    texts?: {
      value?: string;
      type?: string;
    }[];
  }[];
}
