import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  username: string;
  email: string;
  token: string;
}

interface StoredSession {
  user: User;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_KEY = 'budget_planner_session';
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  private idleTimer: any;
  private lastActivity: number = Date.now();

  constructor(private router: Router) {
    // Initialize with stored session if available (check both storages)
    const storedSession = this.getStoredSession();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedSession);
    this.currentUser = this.currentUserSubject.asObservable();

    // If user is logged in, start idle monitoring
    if (storedSession) {
      this.startIdleMonitoring();
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  login(username: string, password: string, rememberMe: boolean = false): Observable<boolean> {
    // This will be replaced with actual API call via ApiService
    // For now, mock authentication
    return new Observable(observer => {
      // Simulate API delay
      setTimeout(() => {
        // Mock validation - accept specific credentials
        if (username === 'Ravi' && password === 'test') {
          const user: User = {
            username: username,
            email: `${username}@budgetplanner.com`,
            token: this.generateMockToken()
          };

          // Store user in session (localStorage if rememberMe, sessionStorage otherwise)
          this.setCurrentUser(user, rememberMe);

          // Start idle monitoring
          this.startIdleMonitoring();

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
    // Clear session from both storages
    this.clearSession();

    // Stop idle monitoring
    this.stopIdleMonitoring();

    // Update subject
    this.currentUserSubject.next(null);

    // Navigate to home
    this.router.navigate(['/']);
  }

  private setCurrentUser(user: User, rememberMe: boolean = false): void {
    // Update BehaviorSubject
    this.currentUserSubject.next(user);

    // Store in sessionStorage or localStorage based on rememberMe
    const session: StoredSession = {
      user: user,
      timestamp: Date.now()
    };

    if (rememberMe) {
      // Use localStorage for persistent storage
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } else {
      // Use sessionStorage for tab-only storage
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }

    // Update last activity
    this.lastActivity = Date.now();
  }

  private getStoredSession(): User | null {
    try {
      // Check sessionStorage first (current session)
      let sessionData = sessionStorage.getItem(this.SESSION_KEY);
      let isFromLocalStorage = false;

      if (!sessionData) {
        // Fallback to localStorage (remembered session)
        sessionData = localStorage.getItem(this.SESSION_KEY);
        isFromLocalStorage = true;
      }

      if (!sessionData) {
        return null;
      }

      const session: StoredSession = JSON.parse(sessionData);

      // Check if session has expired (30 minutes)
      const sessionAge = Date.now() - session.timestamp;
      if (sessionAge > this.SESSION_TIMEOUT) {
        // Session expired, clear it
        this.clearSession();
        return null;
      }

      // Update timestamp on retrieval (refresh session)
      this.updateSessionTimestamp(isFromLocalStorage);

      return session.user;
    } catch (error) {
      console.error('Error reading session:', error);
      return null;
    }
  }

  private updateSessionTimestamp(isFromLocalStorage: boolean = false): void {
    try {
      // Determine which storage to update
      let sessionData: string | null;
      let storage: Storage;

      if (sessionStorage.getItem(this.SESSION_KEY)) {
        sessionData = sessionStorage.getItem(this.SESSION_KEY);
        storage = sessionStorage;
      } else if (localStorage.getItem(this.SESSION_KEY)) {
        sessionData = localStorage.getItem(this.SESSION_KEY);
        storage = localStorage;
      } else {
        return;
      }

      if (sessionData) {
        const session: StoredSession = JSON.parse(sessionData);
        session.timestamp = Date.now();
        storage.setItem(this.SESSION_KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error updating session timestamp:', error);
    }
  }

  private clearSession(): void {
    // Clear from both storages
    sessionStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_KEY);
  }

  private startIdleMonitoring(): void {
    // Track user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Listen to activity events
    activityEvents.forEach(eventName => {
      document.addEventListener(eventName, this.resetIdleTimer.bind(this), true);
    });

    // Start the idle timer
    this.resetIdleTimer();
  }

  private stopIdleMonitoring(): void {
    // Clear the idle timer
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    // Remove event listeners
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    activityEvents.forEach(eventName => {
      document.removeEventListener(eventName, this.resetIdleTimer.bind(this), true);
    });
  }

  private resetIdleTimer(): void {
    // Update last activity time
    this.lastActivity = Date.now();

    // Update session timestamp
    this.updateSessionTimestamp();

    // Clear existing timer
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    // Set new timer for 30 minutes
    this.idleTimer = setTimeout(() => {
      this.handleIdleTimeout();
    }, this.SESSION_TIMEOUT);
  }

  private handleIdleTimeout(): void {
    console.log('Session timed out due to inactivity');

    // Show alert to user (optional)
    alert('Your session has expired due to inactivity. Please login again.');

    // Logout user
    this.logout();
  }

  private generateMockToken(): string {
    return 'mock-jwt-token-' + Math.random().toString(36).substring(2, 15);
  }

  // Method to manually refresh session (call this on critical actions)
  public refreshSession(): void {
    if (this.isAuthenticated) {
      // Determine which storage has the session
      const isFromLocalStorage = localStorage.getItem(this.SESSION_KEY) !== null;
      this.updateSessionTimestamp(isFromLocalStorage);
      this.resetIdleTimer();
    }
  }
}
