import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, mergeMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ErrorHandlerService } from '../service/error-handler.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor(private errorHandler: ErrorHandlerService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      // Retry logic with exponential backoff for retryable errors
      retry({
        count: environment.retryAttempts,
        delay: (error: HttpErrorResponse, retryCount: number) => {
          // Only retry if error is retryable
          if (this.errorHandler.isRetryableError(error)) {
            const delay = this.errorHandler.getRetryDelay(retryCount);

            if (environment.enableLogging) {
              console.log(`🔄 Retrying request (attempt ${retryCount}/${environment.retryAttempts}) after ${delay}ms...`);
            }

            return timer(delay);
          }

          // Don't retry - throw the error
          return throwError(() => error);
        }
      }),

      // Catch and handle errors
      catchError((error: HttpErrorResponse) => {
        return this.errorHandler.handleError(error);
      })
    );
  }
}
