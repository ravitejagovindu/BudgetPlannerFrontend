import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ledger } from '../model/ledger';
import { Planner } from '../model/planner';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  hostUrl =
    'https://budget-planner-container.jollyisland-dddd3064.southindia.azurecontainerapps.io/';
  // hostUrl="localhost:8080/";

  constructor(private http: HttpClient) {}

  getAllBudgetTypes() {
    return this.http.get<any>(this.hostUrl + 'budget/types');
  }

  getAllPaidBys() {
    return this.http.get<any>(this.hostUrl + 'budget/paidBys');
  }

  getAllPlanners(year: number, month: number) {
    return this.http.get<any>(
      this.hostUrl + 'planners?month=' + month + '&year=' + year
    );
  }

  createPlanner(planner: Planner) {
    return this.http.post<any>(this.hostUrl + 'planners', planner);
  }

  editPlanner(id: number, planner: Planner) {
    return this.http.put<any>(this.hostUrl + 'planners/' + id, planner);
  }

  deletePlanner(id: number) {
    return this.http.delete<any>(this.hostUrl + 'planners' + id);
  }

  getAllLedgersByYear(year: number) {
    return this.http.get<any>(this.hostUrl + 'dashboard/ledgers?year=' + year);
  }

  getAllExpensesByYear(year: number) {
    return this.http.get<any>(this.hostUrl + 'dashboard/expenses?year=' + year);
  }

  getAllProjectionsByMonthAndYear(month: number, year: number) {
    return this.http.get<any>(
      this.hostUrl + 'dashboard/projections?month=' + month + '&year=' + year
    );
  }

  getIndividualBalances(month: number, year: number) {
    return this.http.get<any>(
      this.hostUrl +
        'dashboard/individualBalances?month=' +
        month +
        '&year=' +
        year
    );
  }

  getAllLedgersByMonthAndYear(year: number, month: number) {
    return this.http.get<any>(
      this.hostUrl + 'ledgers?month=' + month + '&year=' + year
    );
  }

  createLedger(ledger: Ledger) {
    return this.http.post(this.hostUrl + 'ledgers', ledger);
  }

  updateLedger(id: number, ledger: Ledger) {
    return this.http.put(this.hostUrl + 'ledgers/' + id, ledger);
  }

  deleteLedger(id: number) {
    return this.http.delete(this.hostUrl + 'ledgers/' + id);
  }

  // AUTHENTICATION METHODS - MOCK IMPLEMENTATION
  // These methods will be replaced with actual backend API calls in future

  authenticateUser(username: string, password: string): Observable<any> {
    // Mock authentication - simulates backend API call
    // TODO: Replace with actual API call: this.http.post<any>(this.hostUrl + 'auth/login', { username, password })

    return of({
      success: true,
      user: {
        username: username,
        email: `${username}@budgetplanner.com`,
        token: 'mock-jwt-token-' + Math.random().toString(36).substring(2, 15),
      },
    }).pipe(delay(500)); // Simulate network delay
  }

  validateToken(token: string): Observable<any> {
    // Mock token validation
    // TODO: Replace with actual API call: this.http.post<any>(this.hostUrl + 'auth/validate', { token })

    return of({
      valid: true,
    }).pipe(delay(200));
  }

  logoutUser(): Observable<any> {
    // Mock logout
    // TODO: Replace with actual API call: this.http.post<any>(this.hostUrl + 'auth/logout', {})

    return of({
      success: true,
    }).pipe(delay(200));
  }
}
