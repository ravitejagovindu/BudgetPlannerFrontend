import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Ledger } from '../model/ledger';
import { Planner } from '../model/planner';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { LoginRequest } from '../model/LoginRequest';
import { LoginResponse } from '../model/LoginResponse';
import { AuthStatusResponse } from '../model/AuthStatusResponse';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  hostUrl =
    'https://budget-planner-container.jollyisland-dddd3064.southindia.azurecontainerapps.io/';
  // hostUrl="localhost:8080/";

  constructor(private http: HttpClient) {}

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
  // Replace these with actual backend endpoints
  // ========================================

  /**
   * Get all categories
   * TODO: Replace with actual API call when backend is ready
   * Expected endpoint: GET /categories
   */
  getAllCategories(): Observable<any> {
    // DUMMY IMPLEMENTATION - Mock data with delay
    const mockCategories = [
      {
        id: 1,
        budgetType: 'Expense',
        categoryName: 'Groceries',
        categoryAmount: 10000,
        subCategories: ['Vegetables', 'Fruits', 'Dairy'],
      },
      {
        id: 2,
        budgetType: 'Income',
        categoryName: 'Salary',
        categoryAmount: 50000,
        subCategories: ['Base Pay', 'Bonus', 'Allowances'],
      },
    ];

    return of(mockCategories).pipe(delay(500));

    // ACTUAL IMPLEMENTATION (uncomment when backend is ready):
    // return this.http.get<any>(this.hostUrl + 'categories');
  }

  /**
   * Create a new category
   * TODO: Replace with actual API call when backend is ready
   * Expected endpoint: POST /categories
   * @param category - Category object with budgetType, categoryName, categoryAmount, subCategories
   */
  createCategory(category: any): Observable<any> {
    // DUMMY IMPLEMENTATION - Simulate success response with delay
    const mockResponse = {
      success: true,
      message: 'Category created successfully',
      data: {
        id: Math.floor(Math.random() * 1000),
        ...category,
      },
    };

    return of(mockResponse).pipe(delay(800));

    // ACTUAL IMPLEMENTATION (uncomment when backend is ready):
    // return this.http.post<any>(this.hostUrl + 'categories', category);
  }

  /**
   * Add subcategories to an existing category
   * TODO: Replace with actual API call when backend is ready
   * Expected endpoint: POST /categories/{categoryId}/subcategories
   * @param categoryId - ID of the category
   * @param subCategories - Array of subcategory names
   */
  addSubCategoriesToCategory(
    categoryId: string,
    subCategories: string[]
  ): Observable<any> {
    // DUMMY IMPLEMENTATION - Simulate success response with delay
    const mockResponse = {
      success: true,
      message: 'Subcategories added successfully',
      data: {
        categoryId: categoryId,
        subCategories: subCategories,
      },
    };

    return of(mockResponse).pipe(delay(800));

    // ACTUAL IMPLEMENTATION (uncomment when backend is ready):
    // return this.http.post<any>(
    //   this.hostUrl + 'categories/' + categoryId + '/subcategories',
    //   { subCategories: subCategories }
    // );
  }

  /**
   * Update an existing category
   * TODO: Replace with actual API call when backend is ready
   * Expected endpoint: PUT /categories/{categoryId}
   * @param categoryId - ID of the category
   * @param category - Updated category object
   */
  updateCategory(categoryId: number, category: any): Observable<any> {
    // DUMMY IMPLEMENTATION
    return of({ success: true, message: 'Category updated' }).pipe(delay(800));

    // ACTUAL IMPLEMENTATION (uncomment when backend is ready):
    // return this.http.put<any>(this.hostUrl + 'categories/' + categoryId, category);
  }

  /**
   * Delete a category
   * TODO: Replace with actual API call when backend is ready
   * Expected endpoint: DELETE /categories/{categoryId}
   * @param categoryId - ID of the category to delete
   */
  deleteCategory(categoryId: number): Observable<any> {
    // DUMMY IMPLEMENTATION
    return of({ success: true, message: 'Category deleted' }).pipe(delay(500));

    // ACTUAL IMPLEMENTATION (uncomment when backend is ready):
    // return this.http.delete<any>(this.hostUrl + 'categories/' + categoryId);
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
    const payload = {
      clientId: clientId.trim(),
    };

    return this.http.post(this.hostUrl + 'kite/onboard', payload, { headers });
  }
}
