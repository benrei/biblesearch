import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

export const slowRequestsInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = Date.now();
  const slowThreshold = 200; // 200 ms, adjust as needed
  const loggerService = inject(LoggerService);

  return next(req).pipe(
    finalize(() => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (duration > slowThreshold) {
        if (req.url.includes('api')) {
          loggerService.logSlowRequest(req, duration);
        }
      }
    })
  );
};
