import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get current user from auth service
    const currentUser = this.authService.currentUserValue;

    // Add JWT token and User-ID to headers if user is logged in
    if (currentUser && currentUser.token && currentUser.username) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${currentUser.token}`,
          'user-Id': currentUser.username.toString()
        }
      });
    }

    // Handle response and errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          // Unauthorized or Forbidden - logout user
          console.error('Authentication error:', error);
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url }
          });
        }
        return throwError(() => error);
      })
    );
  }
}
