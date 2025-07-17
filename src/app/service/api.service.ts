import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ledger } from '../model/ledger';
import { Planner } from '../model/planner';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {}

  getAllBudgetTypes() {
    return this.http.get<any>('http://localhost:8080/budget/types');
  }

  getAllPlanners(year: number, month: number) {
    return this.http.get<any>(
      'http://localhost:8080/planners?month=' + month + '&year=' + year
    );
  }

  createPlanner(planner: Planner) {
    return this.http.post<any>('http://localhost:8080/planners', planner);
  }

  editPlanner(id: number, planner: Planner) {
    return this.http.put<any>('http://localhost:8080/planners/' + id, planner);
  }

  deletePlanner(id: number) {
    return this.http.delete<any>('http://localhost:8080/planners'+id);
  }

  getAllLedgersByYear(year: number) {
    return this.http.get<any>(
      'http://localhost:8080/dashboard/ledgers?year=' + year
    );
  }

  getAllExpensesByYear(year: number) {
    return this.http.get<any>(
      'http://localhost:8080/dashboard/expenses?year=' + year
    );
  }

  getAllProjectionsByMonthAndYear(month: number, year: number) {
    return this.http.get<any>(
      'http://localhost:8080/dashboard/projections?month=' + month + '&year=' + year
    );
  }

  getAllLedgersByMonthAndYear(year: number, month: number) {
    return this.http.get<any>(
      'http://localhost:8080/ledgers?month=' + month + '&year=' + year
    );
  }

  createLedger(ledger: Ledger) {
    return this.http.post('http://localhost:8080/ledgers', ledger);
  }

  updateLedger(id: number, ledger: Ledger) {
    return this.http.put('http://localhost:8080/ledgers/'+id, ledger);
  }

  deleteLedger(id: number) {
    return this.http.delete('http://localhost:8080/ledgers/'+id);
  }

}
