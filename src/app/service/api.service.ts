import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Ledger } from '../model/ledger';
import { Planner } from '../model/planner';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { LoginRequest } from '../model/LoginRequest';
import { LoginResponse } from '../model/LoginResponse';
import { AuthStatusResponse } from '../model/AuthStatusResponse';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  hostUrl =
    // 'https://budget-planner-container.jollyisland-dddd3064.southindia.azurecontainerapps.io/';
    // 'localhost:8080/';
    environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  login(loginRequest: LoginRequest) {
    return this.http.post<any>(this.hostUrl + 'auth/login', loginRequest);
  }

  logout() {
    return this.http.post(this.hostUrl + 'auth/logout', {});
  }

  userSessionStatus(currentUser: any) {
    return this.http.get<AuthStatusResponse>(this.hostUrl + 'auth/status', {
      headers: {
        Authorization: `Bearer ${currentUser.token}`,
        'User-Id': currentUser.userId.toString(),
      },
    });
  }

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

  // ========================================
  // CATEGORY MANAGEMENT METHODS - DUMMY API CALLS
  // ========================================

  /**
   * Get all categories
   */
  getAllCategories(): Observable<any> {
    // DUMMY IMPLEMENTATION - Mock data with subcategory amounts
    const mockCategories = [
      {
        id: 1,
        budgetType: 'Expense',
        categoryName: 'Groceries',
        categoryAmount: 15000,
        subCategories: [
          { name: 'Vegetables', amount: 5000 },
          { name: 'Fruits', amount: 3000 },
          { name: 'Provisions', amount: 7000 }
        ],
      },
      {
        id: 2,
        budgetType: 'Income',
        categoryName: 'Salary',
        categoryAmount: 80000,
        subCategories: [
          { name: 'Base Pay', amount: 60000 },
          { name: 'Bonus', amount: 20000 }
        ],
      },
      {
        id: 3,
        budgetType: 'Investments',
        categoryName: 'Mutual Funds',
        categoryAmount: 20000,
        subCategories: [
          { name: 'SIP', amount: 15000 },
          { name: 'Lumpsum', amount: 5000 }
        ],
      }
    ];

    return of(mockCategories).pipe(delay(500));
  }

  /**
   * Create a new category
   */
  createCategory(category: any): Observable<any> {
    // DUMMY IMPLEMENTATION
    const mockResponse = {
      success: true,
      message: 'Category created successfully',
      data: {
        id: Math.floor(Math.random() * 1000),
        ...category,
      },
    };
    return of(mockResponse).pipe(delay(800));
  }

  /**
   * Update an existing category (amount or subcategories)
   */
  updateCategory(categoryId: number | undefined, category: any): Observable<any> {
    // DUMMY IMPLEMENTATION
    return of({ success: true, message: 'Category updated successfully', data: category }).pipe(delay(800));
  }

  /**
   * Delete a category
   */
  deleteCategory(categoryId: number | undefined): Observable<any> {
    // DUMMY IMPLEMENTATION
    return of({ success: true, message: 'Category deleted successfully' }).pipe(delay(500));
  }

  // ========================================
  // ZERODHA INTEGRATION METHODS
  // ========================================

  /**
   * Get Zerodha login URL from backend
   * Endpoint: GET localhost:8080/auth/login-url
   * Returns: { url: "https://kite.zerodha.com/connect/login?..." }
   */
  getZerodhaLoginUrl(headers: HttpHeaders): Observable<any> {
    return this.http.post<any>(this.hostUrl + 'kite/connect', {}, { headers });
  }

  getZerodhaConnectionStatus(): Observable<any> {
    return this.http.get<any>(this.hostUrl + 'kite/status');
  }

  disconnectZerodha(headers: HttpHeaders): Observable<any> {
    return this.http.post<any>(
      this.hostUrl + 'kite/disconnect',
      {},
      { headers }
    );
  }

  getHodlings(headers: HttpHeaders): Observable<any> {
    return this.http.get<any>(this.hostUrl + 'portfolio/holdings', { headers });
  }

  getZerodhaPositions(headers: HttpHeaders): Observable<any> {
    return this.http.get<any>(this.hostUrl + 'portfolio/positions', {
      headers,
    });
  }

  getZerodhaFunds(headers: HttpHeaders): Observable<any> {
    return this.http.get<any>(this.hostUrl + 'portfolio/funds', { headers });
  }

  getMutualFunds(headers: HttpHeaders): Observable<any> {
    return this.http.get<any>(this.hostUrl + 'portfolio/mutualFunds', {
      headers,
    });
  }

  onboardZerodhaAccount(
    clientId: string,
    headers: HttpHeaders
  ): Observable<any> {
    return this.http.post(
      this.hostUrl + 'broker/' + clientId,
      {},
      {
        headers,
      }
    );
  }

  unLinkZerodhaAccount(
    clientId: string,
    headers: HttpHeaders
  ): Observable<any> {
    return this.http.post(
      this.hostUrl + 'broker/' + clientId,
      {},
      {
        headers,
      }
    );
  }
  // ========================================
  // BANK PORTFOLIO MOCK APIs
  // ========================================

  getBankAccounts(): Observable<any> {
    const mockData = [
      { id: 1, bankName: 'HDFC Bank', accountType: 'Savings', accountNumber: 'XXXX1234', balance: 145000.50, logo: 'hdfc' },
      { id: 2, bankName: 'SBI', accountType: 'Savings', accountNumber: 'XXXX5678', balance: 25000.00, logo: 'sbi' },
      { id: 3, bankName: 'ICICI Bank', accountType: 'Current', accountNumber: 'XXXX9012', balance: 450000.00, logo: 'icici' }
    ];
    return of({ data: mockData }).pipe(delay(800));
  }

  getFixedDeposits(): Observable<any> {
    const mockData = [
      { id: 1, bankName: 'HDFC Bank', fdNumber: 'FD-8899', principal: 100000, interestRate: 7.1, maturityDate: '2025-12-01', maturityAmount: 115000 },
      { id: 2, bankName: 'SBI', fdNumber: 'FD-7766', principal: 50000, interestRate: 6.8, maturityDate: '2024-10-15', maturityAmount: 54000 }
    ];
    return of({ data: mockData }).pipe(delay(700));
  }

  getRecurringDeposits(): Observable<any> {
    const mockData = [
      { id: 1, bankName: 'ICICI Bank', rdNumber: 'RD-3344', monthlyAmount: 5000, interestRate: 7.0, maturityDate: '2026-05-01', accumulatedAmount: 35000 }
    ];
    return of({ data: mockData }).pipe(delay(600));
  }

  // ========================================
  // DEMAT PORTFOLIO EXTRA MOCK APIs
  // ========================================

  // Mutual funds bought via Bank/Apps (Not Zerodha)
  getOtherMutualFunds(): Observable<any> {
    const mockData = [
      { id: 1, fundName: 'Axis Bluechip Fund', units: 150.5, nav: 45.2, currentValue: 6802.6, investedValue: 5000 },
      { id: 2, fundName: 'Mirae Asset Emerging Bluechip', units: 200, nav: 89.5, currentValue: 17900, investedValue: 12000 }
    ];
    return of({ data: mockData }).pipe(delay(800));
  }

  getNPSDetails(): Observable<any> {
    const mockData = {
      pran: 'XXXX-XXXX-1234',
      tier1Balance: 560000,
      tier2Balance: 0,
      totalHoldings: 560000,
      schemeName: 'HDFC Pension Fund'
    };
    return of({ data: mockData }).pipe(delay(900));
  }

  getPPFDetails(): Observable<any> {
    const mockData = {
      accountNumber: 'XXXX-XXXX-9988',
      bankName: 'SBI',
      balance: 1250000,
      maturityDate: '2030-04-01',
      yearlyContribution: 150000
    };
    return of({ data: mockData }).pipe(delay(600));
  }
}
