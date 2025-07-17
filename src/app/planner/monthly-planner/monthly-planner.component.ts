import { Component, OnInit } from '@angular/core';
import { Planner } from '../../model/planner';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-monthly-planner',
  standalone: false,
  templateUrl: './monthly-planner.component.html',
  styleUrl: './monthly-planner.component.css',
})
export class MonthlyPlannerComponent implements OnInit {
  durationOptions: string[] = ['Whole Year', 'Current Month'];
  categories: Set<string> | undefined;
  allTypes: Map<string, Set<string>> = new Map();

  allPlanners: Planner[] = [];
  incomeRecords: Set<Planner> = new Set();
  savingsRecords: Set<Planner> = new Set();
  investmentsRecords: Set<Planner> = new Set();
  expenseRecords: Set<Planner> = new Set();

  showPlanner: boolean = true;
  editPlanner: boolean = false;
  showIncome: boolean = true;
  showSavings: boolean = false;
  showInvestments: boolean = false;
  showExpenses: boolean = false;

  remainingBalanceToPlan: number = 0;
  showHigherAmountAlert: boolean = false;

  date = new Date();
  month = this.date.getMonth() + 1;
  year = this.date.getFullYear();
  currentMonthYear = `${this.year}-${this.month < 10 ? '0' : ''}${this.month}`;

  constructor(private apiService: ApiService) {
    this.plannerEntry.controls['category'].disable();
    this.plannerEntry.controls['amount'].disable();
  }

  plannerEntry: FormGroup = new FormGroup({
    month: new FormControl(this.currentMonthYear, Validators.required),
    type: new FormControl('', Validators.required),
    category: new FormControl('', Validators.required),
    amount: new FormControl(null, Validators.required),
  });

  ngOnInit(): void {
    this.apiService.getAllBudgetTypes().subscribe((response) => {
      this.populateTypesAndCategoriesDropdowns(response.data);
    });
    this.fetchRecords(this.currentMonthYear);
  }

  fetchRecords(yearMonth: string) {
    let selectedMonth = parseInt(yearMonth.split('-')[1]);
    let selectedYear = parseInt(yearMonth.split('-')[0]);
    this.incomeRecords = new Set();
    this.savingsRecords = new Set();
    this.investmentsRecords = new Set();
    this.expenseRecords = new Set();
    this.apiService
      .getAllPlanners(selectedYear, selectedMonth)
      .subscribe((response) => {
        this.allPlanners = response.data;
        this.populateRecords(this.allPlanners);
      });
  }

  populateRecords(data: Planner[]) {
    let income: number = 0;
    let spent: number = 0;
    for (let plan of data) {
      if (plan.type == 'INCOME') {
        this.incomeRecords.add(plan);
        income = income + plan.projected;
      } else if (plan.type == 'SAVING') {
        this.savingsRecords.add(plan);
        spent = spent + plan.projected;
      } else if (plan.type == 'INVESTMENT') {
        this.investmentsRecords.add(plan);
        spent = spent + plan.projected;
      } else if (plan.type == 'EXPENSE') {
        this.expenseRecords.add(plan);
        spent = spent + plan.projected;
      }
    }
    this.remainingBalanceToPlan = income - spent;
  }

  populateTypesAndCategoriesDropdowns(allData: any) {
    this.allTypes = new Map();
    for (let data of allData) {
      let categories = this.allTypes.get(data.type);
      if (!categories) {
        categories = new Set();
      }
      categories.add(data.category);
      this.allTypes.set(data.type, categories);
    }
  }

  showCategories() {
    let selectedType = this.plannerEntry.value.type;
    this.categories = this.allTypes.get(selectedType);
    let currentCategory = this.categories?.values().next().value;
    if (!currentCategory) {
      return;
    }
    this.plannerEntry.controls['category'].setValue(currentCategory);
    this.plannerEntry.controls['category'].enable();
    this.plannerEntry.controls['amount'].enable();
  }

  save() {
    let entry = this.plannerEntry.value;
    this.showHigherAmountAlert = false;
    if (entry.amount > this.remainingBalanceToPlan)
      this.showHigherAmountAlert = true;
    else if (entry.duration === 'Current Month') {
      this.apiService
        .createPlanner(entry)
        .subscribe((data) => this.fetchRecords(this.currentMonthYear));
    }
  }

  validateEnteredAmount(amount: number) {
    this.showHigherAmountAlert = false;
    if (amount > this.remainingBalanceToPlan) this.showHigherAmountAlert = true;
  }

  editProjection(yearMonth: string, record: Planner) {
    record.canEdit = !record.canEdit;
    if (!record.canEdit) {
      record.month = yearMonth.split('-')[1];
      record.year = parseInt(yearMonth.split('-')[0]);
      this.apiService
        .editPlanner(record.baseId, record)
        .subscribe((response) => {
          this.allPlanners.push(record);
          this.populateRecords(this.allPlanners);
        });
    }
  }

  deleteProjection(yearMonth: string, record: Planner) {
    if (!record.canEdit) {
      record.month = yearMonth.split('-')[1];
      record.year = parseInt(yearMonth.split('-')[0]);
      this.apiService
        .deletePlanner(record.baseId)
        .subscribe((data) => this.fetchRecords(this.currentMonthYear));
    } else {
      record.canEdit = !record.canEdit;
    }
  }

  toggleShowPlanner() {
    this.showPlanner = !this.showPlanner;
    this.editPlanner = false;
  }
  toggleCreatePlanner() {
    this.editPlanner = !this.editPlanner;
    this.showPlanner = false;
  }
  toggleShowIncome() {
    this.showIncome = !this.showIncome;
    this.showSavings = false;
    this.showInvestments = false;
    this.showExpenses = false;
  }
  toggleShowSavings() {
    this.showIncome = false;
    this.showSavings = !this.showSavings;
    this.showInvestments = false;
    this.showExpenses = false;
  }
  toggleShowInvestments() {
    this.showIncome = false;
    this.showSavings = false;
    this.showInvestments = !this.showInvestments;
    this.showExpenses = false;
  }
  toggleShowExpenses() {
    this.showIncome = false;
    this.showSavings = false;
    this.showInvestments = false;
    this.showExpenses = !this.showExpenses;
  }
}
