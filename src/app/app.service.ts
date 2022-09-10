import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppService {
  menuVisible$ = new BehaviorSubject<boolean>(false);

  constructor() {}
}
