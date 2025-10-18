import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  username: string;
  email: string;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private router: Router) {
    // Initialize with null, no persistence for security
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  login(username: string, password: string): Observable<boolean> {
    // This will be replaced with actual API call via ApiService
    // For now, mock authentication
    return new Observable((observer) => {
      // Simulate API delay
      setTimeout(() => {
        // Mock validation - accept any non-empty credentials
        if (
          (username === 'Ravi' || username === 'ravi') &&
          password === 'test'
        ) {
          const user: User = {
            username: username,
            email: `${username}@budgetplanner.com`,
            token: this.generateMockToken(),
          };
          this.currentUserSubject.next(user);
          observer.next(true);
          observer.complete();
        } else {
          observer.next(false);
          observer.complete();
        }
      }, 500);
    });
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  private generateMockToken(): string {
    return 'mock-jwt-token-' + Math.random().toString(36).substring(2, 15);
  }
}
