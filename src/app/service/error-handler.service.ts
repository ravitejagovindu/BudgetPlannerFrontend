import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  timestamp: Date;
  userFriendlyMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  /**
   * Handle HTTP errors and convert them to user-friendly messages
   */
  handleError(error: HttpErrorResponse): Observable<never> {
    const appError: AppError = {
      message: error.message,
      statusCode: error.status,
      timestamp: new Date(),
      userFriendlyMessage: this.getUserFriendlyMessage(error)
    };

    // Log error if logging is enabled
    if (environment.enableLogging) {
      this.logError(appError, error);
    }

    // Return user-friendly error
    return throwError(() => appError);
  }

  /**
   * Convert HTTP error to user-friendly message
   */
  private getUserFriendlyMessage(error: HttpErrorResponse): string {
    // Client-side or network error
    if (error.error instanceof ErrorEvent) {
      return 'A network error occurred. Please check your internet connection and try again.';
    }

    // Server-side error
    switch (error.status) {
      case 0:
        return 'Unable to connect to the server. Please check your internet connection.';
      
      case 400:
        return error.error?.message || 'Invalid request. Please check your input and try again.';
      
      case 401:
        return 'Your session has expired. Please log in again.';
      
      case 403:
        return 'You do not have permission to perform this action.';
      
      case 404:
        return 'The requested resource was not found.';
      
      case 408:
        return 'Request timeout. Please try again.';
      
      case 409:
        return 'A conflict occurred. The data may have been modified by another user.';
      
      case 422:
        return error.error?.message || 'Unable to process your request. Please check your input.';
      
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      
      case 500:
        return 'An internal server error occurred. Our team has been notified.';
      
      case 502:
      case 503:
        return 'The service is temporarily unavailable. Please try again in a few moments.';
      
      case 504:
        return 'The server took too long to respond. Please try again.';
      
      default:
        if (error.status >= 500) {
          return 'A server error occurred. Please try again later.';
        }
        return error.error?.message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Log error details for debugging
   */
  private logError(appError: AppError, originalError: HttpErrorResponse): void {
    const logLevel = environment.logLevel;
    
    if (logLevel === 'debug' || logLevel === 'error') {
      console.group('🔴 Application Error');
      console.error('Timestamp:', appError.timestamp.toISOString());
      console.error('Status Code:', appError.statusCode);
      console.error('Message:', appError.message);
      console.error('User Message:', appError.userFriendlyMessage);
      console.error('Original Error:', originalError);
      console.groupEnd();
    }
  }

  /**
   * Determine if an error is retryable
   */
  isRetryableError(error: HttpErrorResponse): boolean {
    // Retry on network errors
    if (error.error instanceof ErrorEvent) {
      return true;
    }

    // Retry on specific status codes
    const retryableStatuses = [0, 408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }

  /**
   * Get retry delay based on attempt number (exponential backoff)
   */
  getRetryDelay(attempt: number): number {
    const baseDelay = environment.retryDelayMs;
    return baseDelay * Math.pow(2, attempt - 1);
  }
}
