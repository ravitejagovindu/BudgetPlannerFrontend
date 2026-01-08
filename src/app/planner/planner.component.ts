import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { ApiService } from '../service/api.service';
import { Planner } from '../model/planner';
import { CategoryRequest } from '../model/CategoryRequest';

/* Local Interfaces for Structure Management */
export interface SubCategory {
  name: string;
  amount: number;
}

export interface Category {
  id?: number;
  budgetType: string;
  categoryName: string;
  categoryAmount: number;
  subCategories: SubCategory[];
}

@Component({
  selector: 'app-planner',
  standalone: false,
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.css'
})
export class PlannerComponent implements OnInit {
  // Navigation
  activeTab: 'monthly' | 'structure' = 'monthly';

  // UI State
  loading: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'success';

  // Date State
  date = new Date();
  month = this.date.getMonth() + 1;
  year = this.date.getFullYear();
  currentMonthYear = `${this.year}-${this.month < 10 ? '0' : ''}${this.month}`;

  // ========================================
  // 1. MONTHLY PROJECTIONS DATA
  // ========================================
  allPlanners: Planner[] = [];
  incomeRecords: Set<Planner> = new Set();
  savingsRecords: Set<Planner> = new Set();
  investmentsRecords: Set<Planner> = new Set();
  expenseRecords: Set<Planner> = new Set();

  remainingBalanceToPlan: number = 0;
  showHigherAmountAlert: boolean = false;

  // Monthly View Toggles
  showProjectionForm: boolean = false;
  activeProjectionType: string = 'INCOME';

  // Projection Form
  projectionForm: FormGroup = new FormGroup({
    month: new FormControl(this.currentMonthYear, Validators.required),
    type: new FormControl('', Validators.required),
    category: new FormControl('', Validators.required),
    amount: new FormControl(null, [Validators.required, Validators.min(0)]),
  });

  // ========================================
  // 2. BUDGET STRUCTURE DATA
  // ========================================
  budgetTypes: string[] = ['Income', 'Expense', 'Investments', 'Savings'];
  allCategories: Category[] = [];
  filteredCategories: Category[] = [];
  categoriesForTypeSet: Set<string> = new Set();

  // Structure Form
  structureForm!: FormGroup;
  creationMode: 'existing' | 'new' = 'existing';
  selectedType: string = '';

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.projectionForm.controls['category'].disable();
    this.projectionForm.controls['amount'].disable();
  }

  ngOnInit(): void {
    this.initializeStructureForm();
    this.loadGlobalData();
    this.fetchMonthlyRecords(this.currentMonthYear);
  }

  initializeStructureForm(): void {
    this.structureForm = this.fb.group({
      budgetType: ['', Validators.required],
      creationMode: ['existing'],
      selectedCategoryId: [''],
      categoryName: ['', Validators.required],
      categoryAmount: ['', [Validators.required, Validators.min(1)]],
      subCategories: this.fb.array([])
    });

    // Watch for Type changes in Structure Form
    this.structureForm.get('budgetType')?.valueChanges.subscribe(type => {
      this.selectedType = type;
      this.filterCategoriesByType(type);
      this.resetStructureSelection();
    });

    // Watch for Mode changes
    this.structureForm.get('creationMode')?.valueChanges.subscribe(mode => {
      this.creationMode = mode;
      this.resetStructureSelection();
    });

    // Watch for Category Selection
    this.structureForm.get('selectedCategoryId')?.valueChanges.subscribe(id => {
      if (this.creationMode === 'existing' && id) {
        this.selectCategoryForEdit(id);
      }
    });
  }

  loadGlobalData(): void {
    this.loading = true;
    this.apiService.getAllCategories().subscribe({
      next: (response: any) => {
        this.allCategories = response;
        this.loading = false;
        // Update dropdowns for projection form if type is selected
        if (this.projectionForm.get('type')?.value) {
          this.updateProjectionCategories();
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error loading categories', error);
      }
    });
  }

  // ========================================
  // MONTHLY PROJECTION LOGIC
  // ========================================

  fetchMonthlyRecords(monthYear: string) {
    this.currentMonthYear = monthYear;
    let selectedMonth = parseInt(monthYear.split('-')[1]);
    let selectedYear = parseInt(monthYear.split('-')[0]);

    this.incomeRecords = new Set();
    this.savingsRecords = new Set();
    this.investmentsRecords = new Set();
    this.expenseRecords = new Set();

    this.loading = true;
    this.apiService.getAllPlanners(selectedYear, selectedMonth).subscribe((response) => {
      this.allPlanners = response.data;
      this.processPlannerRecords(this.allPlanners);
      this.loading = false;
    });
  }

  processPlannerRecords(data: Planner[]) {
    let income: number = 0;
    let spent: number = 0;
    for (let plan of data) {
      if (plan.type === 'INCOME') {
        this.incomeRecords.add(plan);
        income += plan.projected;
      } else if (plan.type === 'SAVING') {
        this.savingsRecords.add(plan);
        spent += plan.projected;
      } else if (plan.type === 'INVESTMENT') {
        this.investmentsRecords.add(plan);
        spent += plan.projected;
      } else if (plan.type === 'EXPENSE') {
        this.expenseRecords.add(plan);
        spent += plan.projected;
      }
    }
    this.remainingBalanceToPlan = income - spent;
  }

  updateProjectionCategories() {
    const selectedType = this.projectionForm.value.type;
    // Map backend types to match the getAllCategories format if necessary
    // Currently MonthlyPlanner uses allData from getAllBudgetTypes which has {type, category, subCategories}
    // We'll use allCategories which we loaded in loadGlobalData
    this.categoriesForTypeSet = new Set(
      this.allCategories
        .filter(c => c.budgetType.toUpperCase() === selectedType.toUpperCase())
        .map(c => c.categoryName)
    );

    let firstCategory = this.categoriesForTypeSet.values().next().value;
    if (firstCategory) {
      this.projectionForm.patchValue({ category: firstCategory });
      this.projectionForm.controls['category'].enable();
      this.projectionForm.controls['amount'].enable();
    } else {
      this.projectionForm.controls['category'].disable();
      this.projectionForm.controls['amount'].disable();
    }
  }

  saveProjection() {
    if (this.projectionForm.invalid) return;

    let entry = this.projectionForm.value;
    this.showHigherAmountAlert = false;

    if (entry.amount > this.remainingBalanceToPlan && entry.type !== 'INCOME') {
      this.showHigherAmountAlert = true;
      return;
    }

    this.loading = true;
    // Note: The backend expects 'month' as a number and year as a number based on previous edits
    // But createPlanner might need the object as defined in model
    this.apiService.createPlanner(entry).subscribe(() => {
      this.fetchMonthlyRecords(this.currentMonthYear);
      this.projectionForm.reset({ month: this.currentMonthYear });
      this.showProjectionForm = false;
      this.loading = false;
      this.showAlert('Projection added successfully', 'success');
    });
  }

  editProjection(record: Planner) {
    record.canEdit = !record.canEdit;
    if (!record.canEdit) {
      record.month = this.currentMonthYear.split('-')[1];
      record.year = parseInt(this.currentMonthYear.split('-')[0]);
      this.apiService.editPlanner(record.baseId, record).subscribe(() => {
        this.fetchMonthlyRecords(this.currentMonthYear);
        this.showAlert('Projection updated', 'success');
      });
    }
  }

  deleteProjection(record: Planner) {
    if (confirm('Delete this projection?')) {
      this.apiService.deletePlanner(record.baseId).subscribe(() => {
        this.fetchMonthlyRecords(this.currentMonthYear);
        this.showAlert('Projection deleted', 'success');
      });
    }
  }

  // ========================================
  // BUDGET STRUCTURE LOGIC
  // ========================================

  filterCategoriesByType(type: string): void {
    this.filteredCategories = this.allCategories.filter(c => c.budgetType === type);
  }

  get subCategoriesFormArray(): FormArray {
    return this.structureForm.get('subCategories') as FormArray;
  }

  resetStructureSelection(): void {
    this.structureForm.patchValue({
      selectedCategoryId: '',
      categoryName: '',
      categoryAmount: ''
    }, { emitEvent: false });

    this.subCategoriesFormArray.clear();

    if (this.creationMode === 'existing') {
      this.structureForm.get('categoryName')?.disable();
    } else {
      this.structureForm.get('categoryName')?.enable();
    }
  }

  selectCategoryForEdit(id: string): void {
    const category = this.filteredCategories.find(c => c.id?.toString() === id);
    if (category) {
      this.structureForm.patchValue({
        categoryName: category.categoryName,
        categoryAmount: category.categoryAmount
      }, { emitEvent: false });

      this.subCategoriesFormArray.clear();
      category.subCategories.forEach(sub => {
        this.subCategoriesFormArray.push(this.fb.group({
          name: [sub.name, Validators.required],
          amount: [sub.amount, [Validators.required, Validators.min(1)]]
        }));
      });
    }
  }

  addSubCategory(): void {
    this.subCategoriesFormArray.push(this.fb.group({
      name: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]]
    }));
  }

  removeSubCategory(index: number): void {
    const subCategory = this.subCategoriesFormArray.at(index).value;
    if (this.creationMode === 'existing' && subCategory.name) {
      if (confirm(`Delete subcategory "${subCategory.name}"?`)) {
        this.loading = true;
        this.apiService.deleteSubcategories([subCategory.name]).subscribe({
          next: () => {
            this.subCategoriesFormArray.removeAt(index);
            this.loading = false;
            this.showAlert('Subcategory deleted', 'success');
          },
          error: () => {
            this.loading = false;
            this.showAlert('Failed to delete subcategory', 'error');
          }
        });
      }
    } else {
      this.subCategoriesFormArray.removeAt(index);
    }
  }

  onStructureSubmit(): void {
    if (this.structureForm.invalid || this.subCategoriesFormArray.length === 0) {
      this.showAlert('Please fill all fields and add at least one subcategory.', 'error');
      return;
    }

    const formVal = this.structureForm.getRawValue();
    const categoryRequest: CategoryRequest = {
      id: this.creationMode === 'existing' ? parseInt(formVal.selectedCategoryId) : 0,
      type: formVal.budgetType,
      category: formVal.categoryName,
      amount: formVal.categoryAmount,
      subcategories: formVal.subCategories.map((s: any) => s.name)
    };

    this.loading = true;
    this.apiService.createCategory(categoryRequest).subscribe({
      next: () => {
        this.showAlert(this.creationMode === 'new' ? 'Category created!' : 'Category updated!', 'success');
        this.loadGlobalData();
        this.resetStructureSelection();
      },
      error: () => {
        this.loading = false;
        this.showAlert('Operation failed.', 'error');
      }
    });
  }

  deleteCategoryStructure(): void {
    const id = this.structureForm.get('selectedCategoryId')?.value;
    if (id && confirm('Delete this category and all its settings?')) {
      this.loading = true;
      this.apiService.deleteCategory(id).subscribe({
        next: () => {
          this.showAlert('Category deleted', 'success');
          this.loadGlobalData();
          this.resetStructureSelection();
        },
        error: () => {
          this.loading = false;
          this.showAlert('Failed to delete category', 'error');
        }
      });
    }
  }

  // ========================================
  // SHARED UTILITIES
  // ========================================

  showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 5000);
  }

  getTotalPlanned(type: string): number {
    let total = 0;
    const records = type === 'INCOME' ? this.incomeRecords :
      type === 'EXPENSE' ? this.expenseRecords :
        type === 'SAVING' ? this.savingsRecords : this.investmentsRecords;
    records.forEach(r => total += r.projected);
    return total;
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'text-success';
    if (balance < 0) return 'text-danger';
    return 'text-muted';
  }

  setActiveTab(tab: 'monthly' | 'structure') {
    this.activeTab = tab;
    if (tab === 'monthly') {
      this.fetchMonthlyRecords(this.currentMonthYear);
    }
  }
}
