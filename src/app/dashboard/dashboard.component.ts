import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ChartService } from '../service/chart.service';
import { Ledger } from '../model/ledger';
import { ApiService } from '../service/api.service';
import { ChartData } from '../model/chartData';
import { ChartTable } from '../model/chartTable';
import { SubCategoriesChartData } from '../model/subCategoriesChartData';
import { OverViewChartData } from '../model/overViewChartData';
import { Projections } from '../model/projections';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements AfterViewInit {
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
  currentMonthYear = `${this.year}-${this.selectedMonth < 10 ? '0' : ''}${
    this.selectedMonth
  }`;
  allLedgerData: Map<number, Map<string, ChartTable[]>> = new Map();
  tableData: ChartTable[] = [];
  subCategoriesChartData: SubCategoriesChartData[] = [];
  expenseSubCategories: Map<
    string,
    Map<string, Map<string, SubCategoriesChartData[]>>
  > = new Map();
  expenseCategoriesByMonth: Map<string, Set<string>> = new Map();
  expenseCategories: Set<string> | undefined = new Set();
  projections: OverViewChartData | undefined;
  projectionsByType: Projections[] = [];

  showOverViewColumnChart: boolean = false;

  constructor(
    private chartServcie: ChartService,
    private apiService: ApiService
  ) {}

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
      this.populateSubCategoriesChart(selectedYear, selectedMonth, '');
    });
    this.fetchOverview(selectedYear, parseInt(monthNumber));
  }

  fetchOverview(selectedYear: number, monthNumber: number) {
    this.projections = undefined;
    this.projectionsByType = [];
    this.apiService
      .getAllProjectionsByMonthAndYear(monthNumber, selectedYear)
      .subscribe((response) => {
        this.projections = response.data;
        this.projectionsByType.push(...response.data.projectionsByType);
        this.populateOverviewChart(this.projectionsByType);
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
    let monthNumber = monthYear.split('-')[1];
    let selectedMonth = this.getMonthName(monthNumber);
    let selectedYear = parseInt(monthYear.split('-')[0]);
    this.populateCharts(selectedMonth);
    this.populateChartTable(selectedMonth);
    this.populateSubCategoriesChart(selectedYear, selectedMonth, '');
    this.fetchOverview(selectedYear, monthNumber);
  }

  populateChartTable(selectedMonth: string) {
    this.tableData = [];
    let allLedgersByYear = this.allLedgerData.get(this.year);
    if (!allLedgersByYear) allLedgersByYear = new Map();
    let allLedgersByMonth = allLedgersByYear.get(selectedMonth);
    if (allLedgersByMonth) {
      allLedgersByMonth.forEach((table) =>
        this.tableData.push(
          new ChartTable(
            table.year,
            table.month,
            table.type,
            table.category,
            table.projected,
            table.actual,
            table.difference
          )
        )
      );
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
}
