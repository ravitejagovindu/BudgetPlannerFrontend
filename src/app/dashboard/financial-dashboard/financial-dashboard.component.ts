import { AfterViewInit, Component } from '@angular/core';
import { ChartService } from '../../service/chart.service';
import { ApiService } from '../../service/api.service';
import { ChartData } from '../../model/chartData';
import { ChartTable } from '../../model/chartTable';
import { SubCategoriesChartData } from '../../model/subCategoriesChartData';
import { OverViewChartData } from '../../model/overViewChartData';
import { Projections } from '../../model/projections';
import * as Highcharts from 'highcharts';
import * as XLSX from 'xlsx';
import { IndividualBalances } from '../../model/individualBalances';
import { Ledger } from '../../model/ledger';

@Component({
  selector: 'app-financial-dashboard',
  standalone: false,
  templateUrl: './financial-dashboard.component.html',
  styleUrl: './financial-dashboard.component.css',
})
export class FinancialDashboardComponent implements AfterViewInit {
  Highcharts: typeof Highcharts = Highcharts;
  incomePieChart!: Highcharts.Options;
  savingsPieChart!: Highcharts.Options;
  investmentPieChart!: Highcharts.Options;
  expensePieChart!: Highcharts.Options;
  expensesSubCategoryPieChart!: Highcharts.Options;
  overviewPieChartProjected!: Highcharts.Options;
  overviewPieChartActual!: Highcharts.Options;
  overviewBarChart!: Highcharts.Options;

  selectedCategory: string = '';
  date = new Date();
  selectedMonth = this.date.getMonth() + 1;
  year = this.date.getFullYear();
  currentMonthYear = `${this.year}-${this.selectedMonth < 10 ? '0' : ''}${this.selectedMonth
    }`;
  allLedgerData: Map<number, Map<string, ChartTable[]>> = new Map();
  tableData: ChartTable[] = [];
  expenseData: ChartTable[] = [];
  savingsData: ChartTable[] = [];
  investmentData: ChartTable[] = [];
  incomeData: ChartTable[] = [];
  individualBalances: IndividualBalances[] = [];
  subCategoriesChartData: SubCategoriesChartData[] = [];
  expenseSubCategories: Map<
    string,
    Map<string, Map<string, SubCategoriesChartData[]>>
  > = new Map();
  expenseCategoriesByMonth: Map<string, Set<string>> = new Map();
  expenseCategories: Set<string> | undefined = new Set();
  projections: OverViewChartData | undefined;
  projectionsByType: Projections[] = [];
  incomeProjections: Projections[] = [];
  otherProjections: Projections[] = [];

  showOverViewColumnChart: boolean = true;

  showIncome: boolean = false;
  showSavings: boolean = false;
  showInvestments: boolean = false;
  showExpenses: boolean = true;

  constructor(
    private chartServcie: ChartService,
    private apiService: ApiService
  ) { }

  ngAfterViewInit(): void {
    this.selectedCategory = '';
    this.allLedgerData = new Map();
    let monthNumber = this.currentMonthYear.split('-')[1];
    let selectedMonth = this.getMonthName(monthNumber);
    let selectedYear = parseInt(this.currentMonthYear.split('-')[0]);
    this.apiService.getAllLedgersByYear(selectedYear).subscribe((response) => {
      let ledgers: ChartTable[] = response.data;
      let ledgersByMonth: Map<string, ChartTable[]> = new Map();
      this.allLedgerData.set(this.year, ledgersByMonth);
      ledgers.forEach((ledger) => {
        let allLedgers = ledgersByMonth.get(ledger.month);
        if (!allLedgers) allLedgers = [];
        allLedgers.push(ledger);
        ledgersByMonth.set(ledger.month, allLedgers);
      });
      this.populateCharts(selectedMonth);
      this.populateChartTable(selectedMonth);
    });

    this.apiService.getAllExpensesByYear(selectedYear).subscribe((response) => {
      let allExpenses: Ledger[] = response.data;
      let expenseSubCategoriesByMonth: Map<
        string,
        Map<string, SubCategoriesChartData[]>
      > = new Map();
      this.expenseSubCategories.set(
        '' + selectedYear,
        expenseSubCategoriesByMonth
      );
      allExpenses.forEach((expense) => {
        let expenseSubCategoriesByCategory:
          | Map<string, SubCategoriesChartData[]>
          | undefined = expenseSubCategoriesByMonth.get(expense.month);
        if (!expenseSubCategoriesByCategory)
          expenseSubCategoriesByCategory = new Map();
        let expenses = expenseSubCategoriesByCategory.get(expense.category);
        if (!expenses) expenses = [];
        expenses.push(
          new SubCategoriesChartData(
            expense.year,
            expense.month,
            expense.type,
            expense.category,
            expense.subCategory,
            expense.amount
          )
        );
        expenseSubCategoriesByCategory.set(expense.category, expenses);
        expenseSubCategoriesByMonth.set(
          expense.month,
          expenseSubCategoriesByCategory
        );
      });
      const selCat = expenseSubCategoriesByMonth.get(selectedMonth);
      this.populateSubCategoriesChart(selectedYear, selectedMonth, '');
    });
    this.fetchOverview(selectedYear, parseInt(monthNumber));
  }

  fetchOverview(selectedYear: number, monthNumber: number) {
    this.projections = undefined;
    this.projectionsByType = [];
    this.incomeProjections = [];
    this.otherProjections = [];
    this.apiService
      .getAllProjectionsByMonthAndYear(monthNumber, selectedYear)
      .subscribe((response) => {
        this.projections = response.data;
        this.projectionsByType.push(...response.data.projectionsByType);
        this.projectionsByType.forEach((projection) => {
          if (projection.type == 'INCOME') {
            this.incomeProjections.push(projection);
          } else {
            this.otherProjections.push(projection);
          }
        });
        this.populateOverviewChart(this.projectionsByType);
      });
    this.apiService
      .getIndividualBalances(monthNumber, selectedYear)
      .subscribe((response) => {
        this.individualBalances = response.data;
      });
  }

  getMonthName(monthNumber: string) {
    let selectedMonth = '';
    switch (monthNumber) {
      case '01':
      case '1':
        selectedMonth = 'JANUARY';
        break;
      case '02':
      case '2':
        selectedMonth = 'FEBRUARY';
        break;
      case '03':
      case '3':
        selectedMonth = 'MARCH';
        break;
      case '04':
      case '4':
        selectedMonth = 'APRIL';
        break;
      case '05':
      case '5':
        selectedMonth = 'MAY';
        break;
      case '06':
      case '6':
        selectedMonth = 'JUNE';
        break;
      case '07':
      case '7':
        selectedMonth = 'JULY';
        break;
      case '08':
      case '8':
        selectedMonth = 'AUGUST';
        break;
      case '09':
      case '9':
        selectedMonth = 'SEPTEMBER';
        break;
      case '10':
        selectedMonth = 'OCTOBER';
        break;
      case '11':
        selectedMonth = 'NOVEMBER';
        break;
      case '12':
        selectedMonth = 'DECEMBER';
        break;
      default:
        console.log('Invalid Month Number provided :: ' + monthNumber);
    }
    return selectedMonth;
  }

  getMonthNumber(monthName: string) {
    let monthNumberFromName: number = 0;
    switch (monthName) {
      case 'JANUARY':
        monthNumberFromName = 1;
        break;
      case 'FEBRUARY':
        monthNumberFromName = 2;
        break;
      case 'MARCH':
        monthNumberFromName = 3;
        break;
      case 'APRIL':
        monthNumberFromName = 4;
        break;
      case 'MAY':
        monthNumberFromName = 5;
        break;
      case 'JUNE':
        monthNumberFromName = 6;
        break;
      case 'JULY':
        monthNumberFromName = 7;
        break;
      case 'AUGUST':
        monthNumberFromName = 8;
        break;
      case 'SEPTEMBER':
        monthNumberFromName = 9;
        break;
      case 'OCTOBER':
        monthNumberFromName = 10;
        break;
      case 'NOVEMBER':
        monthNumberFromName = 11;
        break;
      case 'DECEMBER':
        monthNumberFromName = 12;
        break;
      default:
        console.log('Invalid Month Number provided :: ' + monthName);
    }
    return monthNumberFromName;
  }

  populateCharts(selectedMonth: string) {
    let incomeChartData: ChartData[] = [];
    let savingsChartData: ChartData[] = [];
    let investmentsChartData: ChartData[] = [];
    let expenseChartData: ChartData[] = [];

    let allLedgersByYear = this.allLedgerData.get(this.year);
    if (!allLedgersByYear) allLedgersByYear = new Map();
    let allLedgersByMonth = allLedgersByYear.get(selectedMonth);
    if (allLedgersByMonth) {
      allLedgersByMonth.forEach((ledger) => {
        if (ledger.type == 'INCOME') {
          incomeChartData.push(new ChartData(ledger.category, ledger.actual));
        } else if (ledger.type == 'SAVING') {
          savingsChartData.push(new ChartData(ledger.category, ledger.actual));
        } else if (ledger.type == 'INVESTMENT') {
          investmentsChartData.push(
            new ChartData(ledger.category, ledger.actual)
          );
        } else if (ledger.type == 'EXPENSE') {
          expenseChartData.push(new ChartData(ledger.category, ledger.actual));
        }
      });
    }
    this.incomePieChart = this.chartServcie.getIncomePieChart(incomeChartData);
    this.savingsPieChart =
      this.chartServcie.getSavingsPieChart(savingsChartData);
    this.investmentPieChart =
      this.chartServcie.getInvestmentPieChart(investmentsChartData);
    this.expensePieChart =
      this.chartServcie.getExpensePieChart(expenseChartData);
  }

  onMonthSelect(monthYear: any) {
    this.currentMonthYear = monthYear; // Update local state from event
    let monthNumber = monthYear.split('-')[1];
    let selectedMonth = this.getMonthName(monthNumber);
    let selectedYear = parseInt(monthYear.split('-')[0]);
    this.expenseData = [];
    this.savingsData = [];
    this.investmentData = [];
    this.incomeData = [];
    if (!this.allLedgerData.get(selectedYear)) {
      this.apiService
        .getAllLedgersByYear(selectedYear)
        .subscribe((response) => {
          let ledgers: ChartTable[] = response.data;
          let ledgersByMonth: Map<string, ChartTable[]> = new Map();
          this.allLedgerData.set(this.year, ledgersByMonth);
          ledgers.forEach((ledger) => {
            let allLedgers = ledgersByMonth.get(ledger.month);
            if (!allLedgers) allLedgers = [];
            allLedgers.push(ledger);
            ledgersByMonth.set(ledger.month, allLedgers);
          });
          this.populateCharts(selectedMonth);
          this.populateChartTable(selectedMonth);
        });
    }
    this.populateSubCategoriesChart(selectedYear, selectedMonth, '');
    this.fetchOverview(selectedYear, monthNumber);
  }

  populateChartTable(selectedMonth: string) {
    let allLedgersByYear = this.allLedgerData.get(this.year);
    if (!allLedgersByYear) allLedgersByYear = new Map();
    let allLedgersByMonth = allLedgersByYear.get(selectedMonth);
    if (allLedgersByMonth) {
      allLedgersByMonth.forEach((table) => {
        if (table.type == 'EXPENSE') {
          this.expenseData.push(
            new ChartTable(
              table.year,
              table.month,
              table.type,
              table.category,
              table.projected,
              table.actual,
              table.difference
            )
          );
        } else if (table.type == 'SAVING') {
          this.savingsData.push(
            new ChartTable(
              table.year,
              table.month,
              table.type,
              table.category,
              table.projected,
              table.actual,
              table.difference
            )
          );
        } else if (table.type == 'INVESTMENT') {
          this.investmentData.push(
            new ChartTable(
              table.year,
              table.month,
              table.type,
              table.category,
              table.projected,
              table.actual,
              table.difference
            )
          );
        } else if (table.type == 'INCOME') {
          this.incomeData.push(
            new ChartTable(
              table.year,
              table.month,
              table.type,
              table.category,
              table.projected,
              table.actual,
              table.difference
            )
          );
        }
      });
    }
  }

  populateSubCategoriesChart(
    selectedYear: number,
    selectedMonth: string,
    selectedCategory: string
  ) {
    this.expenseCategories = new Set();
    let subCategoriesChartDataByYear:
      | Map<string, Map<string, SubCategoriesChartData[]>>
      | undefined = this.expenseSubCategories.get('' + selectedYear);
    if (!subCategoriesChartDataByYear) subCategoriesChartDataByYear = new Map();
    let subCategoriesChartDataByMonth:
      | Map<string, SubCategoriesChartData[]>
      | undefined = subCategoriesChartDataByYear.get(selectedMonth);
    if (!subCategoriesChartDataByMonth)
      subCategoriesChartDataByMonth = new Map();
    let allCategories: string[] = [];
    subCategoriesChartDataByMonth.forEach((value: SubCategoriesChartData[]) => {
      value.forEach((value) => allCategories.push(value.category));
    });
    let subCategoriesChartDataByCategory: SubCategoriesChartData[] | undefined =
      subCategoriesChartDataByMonth.get(
        selectedCategory == '' ? allCategories[0] : selectedCategory
      );
    if (!subCategoriesChartDataByCategory)
      subCategoriesChartDataByCategory = [];
    let subCategoriesChartData: ChartData[] = [];
    subCategoriesChartDataByCategory.forEach((expense) =>
      subCategoriesChartData.push(
        new ChartData(expense.subCategory, expense.amount)
      )
    );
    this.expensesSubCategoryPieChart =
      this.chartServcie.getExpenseSubCategoriesPieChart(subCategoriesChartData);
    this.expenseCategories = new Set(allCategories);
  }

  refreshSubCategoriesChart() {
    let monthNumber = this.currentMonthYear.split('-')[1];
    let currentMonth = this.getMonthName(monthNumber);
    this.populateSubCategoriesChart(
      this.year,
      currentMonth,
      this.selectedCategory
    );
  }

  populateOverviewChart(projections: Projections[]) {
    let projectedPieChartData: ChartData[] = [];
    let actualPieChartData: ChartData[] = [];
    let incomeProjected: number = 0;
    let incomeActual: number = 0;
    projections.forEach((projection) => {
      if (projection.type !== 'INCOME') {
        projectedPieChartData.push(
          new ChartData(projection.type, projection.projected)
        );
        actualPieChartData.push(
          new ChartData(projection.type, projection.actual)
        );
      } else {
        incomeProjected = projection.projected;
        incomeActual = projection.actual;
      }
    });
    this.overviewPieChartProjected =
      this.chartServcie.getOverviewPieChartProjected(
        projectedPieChartData,
        'Projected<br/>' + incomeProjected
      );
    this.overviewPieChartActual = this.chartServcie.getOverviewPieChartActual(
      actualPieChartData,
      'Actual<br/>' + incomeActual
    );
    this.overviewBarChart = this.chartServcie.getOverviewBarChart(projections);
  }

  toggleShowOverViewColumnGraph() {
    this.showOverViewColumnChart = !this.showOverViewColumnChart;
  }

  exportDetailedBreakdownTableToExcel(): void {
    const element = document.getElementById('detailed-breakdown');
    if (!element) {
      alert('Table not found.');
      return;
    }

    // Extract year and month from your currentMonthYear variable
    const [year, month] = this.currentMonthYear.split('-');
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString(
      'default',
      { month: 'long' }
    );

    const fileName = `${monthName}_${year}_Overview.xlsx`;

    // Convert table to sheet
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);

    // Find range of the sheet
    const range = XLSX.utils.decode_range(ws['!ref'] as string);

    // Remove the last column (Actions column)
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cell_address = { c: range.e.c, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      delete ws[cell_ref];
    }

    // Update the range to exclude last column
    range.e.c = range.e.c - 1;
    ws['!ref'] = XLSX.utils.encode_range(range);

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Overview');
    XLSX.writeFile(wb, fileName);
  }

  showIncomeData() {
    this.showIncome = true;
    this.showSavings = false;
    this.showInvestments = false;
    this.showExpenses = false;
  }
  showSavingsData() {
    this.showIncome = false;
    this.showSavings = true;
    this.showInvestments = false;
    this.showExpenses = false;
  }
  showInvestmentData() {
    this.showIncome = false;
    this.showSavings = false;
    this.showInvestments = true;
    this.showExpenses = false;
  }
  showExpenseData() {
    this.showIncome = false;
    this.showSavings = false;
    this.showInvestments = false;
    this.showExpenses = true;
  }

  // NEW METHODS FOR PROGRESS BAR FUNCTIONALITY

  /**
   * Calculate the percentage of actual amount vs projected amount
   * @param actual - The actual amount spent/earned
   * @param projected - The projected/budgeted amount
   * @returns Percentage value (can exceed 100)
   */
  getProgressPercentage(actual: number, projected: number): number {
    if (projected === 0) {
      return 0;
    }
    const percentage = (actual / projected) * 100;
    return Math.round(percentage);
  }

  // NEW HELPER METHODS FOR ENHANCED UI (Added for CSS styling support)
  getSummaryCardClass(difference: number): string {
    if (difference > 0) return 'positive-card';
    if (difference < 0) return 'negative-card';
    return 'neutral-card';
  }

  getDifferenceClass(difference: number): string {
    if (difference > 0) return 'status-positive';
    if (difference < 0) return 'status-negative';
    return 'status-neutral';
  }

  getSummaryCardIcon(type: string): string {
    const types = new Map();
    types.set('INCOME', 'bi bi-arrow-down-circle');
    types.set('EXPENSE', 'bi bi-arrow-up-circle');
    types.set('SAVING', 'bi bi-piggy-bank');
    types.set('INVESTMENT', 'bi bi-graph-up-arrow');
    return types.get(type) || 'bi bi-circle';
  }

  getTypeBadgeClass(type: string): string {
    return `${type.toLowerCase()}-badge`;
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'status-positive';
    if (balance < 0) return 'status-negative';
    return 'status-neutral';
  }
}
