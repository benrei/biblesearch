import { HttpClient, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import packageJson from '../../../package.json';
const { version } = packageJson;

@Injectable({ providedIn: 'root' })
export class LoggerService {
  constructor(private http: HttpClient) {}

  logSlowRequest<TData = unknown>(req: HttpRequest<TData>, duration: number) {
    const { method, body, url } = req;
    const { loggerUrl, production } = environment;
    const app = { name: 'biblesearch.app', type: 'Angular', version };
    const level = 'warn';
    const tag = 'slowRequest';
    const request = { method, body, url };
    const info = { duration, production, request, tag };
    const reqBody = { app, info, level, tag };

    this.http.post(loggerUrl, reqBody).subscribe({
      next: () => console.log('Slow request logged successfully'),
      error: (error) => console.error('Error logging slow request:', error),
    });
  }
}
