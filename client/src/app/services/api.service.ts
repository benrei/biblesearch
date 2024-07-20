import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Verse } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  search(query: string): Observable<any[]> {
    const { apiUrl } = environment;
    return this.http.get<any[]>(`${apiUrl}/search?q=${query}`);
  }

  getVerses(book: number, chapter: number): Observable<Verse[]> {
    const { apiUrl } = environment;
    return this.http.get<any[]>(
      `${apiUrl}/verses?book=${book}&chapter=${chapter}`
    );
  }
}
