import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: './verse.component.html',
  styleUrls: ['./verse.component.css'],
})
export class VerseComponent implements OnInit {
  constructor(private http: HttpClient, private router: Router) {
    const path = this.router.url;
    const queryValues = path.substring(6).split('/');

    // const url =
    //   'https://westeurope.azure.data.mongodb-api.com/app/biblesearchapp-ooywx/endpoint/chapter';
    // this.http.get(url).subscribe((res) => {
    //   console.log(res);
    // });
  }

  ngOnInit(): void {}
}
