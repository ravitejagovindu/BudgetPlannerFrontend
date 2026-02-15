import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { ApiService } from '../service/api.service';
import { Planner } from '../model/planner';
import { CategoryRequest } from '../model/CategoryRequest';

export interface Category {
  id?: number;
  type: string;
  category: string;
  amount: number;
  subCategories: string[];
}

export interface PlannerDTO {
  baseId: number;
  updatedId: number;
  year: number;
  month: string;
  category: string;
  type: string;
  projected: number;
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
  // 1. MONTHLY PROJECTIONS DATA (NOW CATEGORY-BASED)
  // ========================================
  incomeCategories: Category[] = [];
  savingsCategories: Category[] = [];
  investmentsCategories: Category[] = [];
  expenseCategories: Category[] = [];

  remainingBalanceToPlan: number = 0;
  showHigherAmountAlert: boolean = false;

  // Monthly View Toggles
  showProjectionForm: boolean = false;
  activeProjectionType: string = 'INCOME';

  // Edit Modal State
  showEditModal: boolean = false;
  editForm!: FormGroup;
  categoryToEdit?: Category;

  // Delete Modal State
  showDeleteModal: boolean = false;
  categoryToDelete?: Category;

  // Subcategory Delete State
  showSubDeleteModal: boolean = false;
  subToDelete: { name: string, index: number, source: 'edit' | 'structure' } | null = null;

  // Projection Form (Enhanced to include subcategories)
  projectionForm!: FormGroup;

  // ========================================
  // 2. BUDGET STRUCTURE DATA
  // ========================================
  budgetTypes: string[] = ['Income', 'Expense', 'Investments', 'Savings'];
  allCategories: Category[] = [];
  monthlyPlanners: PlannerDTO[] = [];
  filteredCategories: Category[] = [];
  categoriesForTypeSet: Set<string> = new Set();

  // Structure Form
  structureForm!: FormGroup;
  creationMode: 'existing' | 'new' = 'existing';
  selectedType: string = '';

  constructor(private fb: FormBuilder, private apiService: ApiService) { }

  ngOnInit(): void {
    this.initializeStructureForm();
    this.initializeEditForm();
    this.initializeProjectionForm();
    this.loadGlobalData();
  }

  initializeProjectionForm(): void {
    this.projectionForm = this.fb.group({
      month: [this.currentMonthYear, Validators.required],
      type: ['', Validators.required],
      category: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0)]],
      subCategories: this.fb.array([])
    });

    this.projectionForm.controls['category'].disable();
    this.projectionForm.controls['amount'].disable();
  }

  initializeEditForm(): void {
    this.editForm = this.fb.group({
      id: [0],
      type: ['', Validators.required],
      category: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      subCategories: this.fb.array([])
    });
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

    this.structureForm.get('budgetType')?.valueChanges.subscribe(type => {
      this.selectedType = type;
      this.filterCategoriesByType(type);
      this.resetStructureSelection();
    });

    this.structureForm.get('creationMode')?.valueChanges.subscribe(mode => {
      this.creationMode = mode;
      this.resetStructureSelection();
    });

    this.structureForm.get('selectedCategoryId')?.valueChanges.subscribe(id => {
      if (this.creationMode === 'existing' && id) {
        this.selectCategoryForEdit(id);
      }
    });
  }

  loadGlobalData(): void {
    this.loading = true;
    // 1. Load Global Categories (Structure)
    this.apiService.getAllCategories().subscribe({
      next: (catRes) => {
        this.allCategories = catRes.data;

        // 2. Load Monthly Planner Records (Projections)
        const [year, month] = this.currentMonthYear.split('-').map(Number);
        this.apiService.getAllPlanners(year, month).subscribe({
          next: (planRes) => {
            this.monthlyPlanners = planRes.data || [];
            this.processCategoryRecords(this.allCategories, this.monthlyPlanners);
            this.loading = false;
            if (this.projectionForm.get('type')?.value) {
              this.updateProjectionCategories();
            }
          },
          error: () => {
            this.loading = false;
            this.processCategoryRecords(this.allCategories, []);
          }
        });
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error loading budget types', error);
      }
    });
  }

  // ========================================
  // MONTHLY PROJECTION LOGIC
  // ========================================

  fetchMonthlyRecords(monthYear: string) {
    this.currentMonthYear = monthYear;
    if (this.projectionForm) {
      this.projectionForm.patchValue({ month: monthYear });
    }
    this.loadGlobalData();
  }

  // ========================================
  // EDIT MODAL ACTIONS
  // ========================================

  get editSubCategoriesArray(): FormArray {
    return this.editForm.get('subCategories') as FormArray;
  }

  openEditModal(cat: Category): void {
    this.categoryToEdit = cat;
    this.editForm.patchValue({
      id: cat.id,
      type: cat.type,
      category: cat.category,
      amount: cat.amount
    });

    this.editSubCategoriesArray.clear();
    cat.subCategories.forEach(sub => {
      this.editSubCategoriesArray.push(this.fb.group({
        name: [sub, Validators.required]
      }));
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.categoryToEdit = undefined;
  }

  addEditSubCategory(): void {
    this.editSubCategoriesArray.push(this.fb.group({
      name: ['', Validators.required]
    }));
  }

  removeEditSubCategory(index: number): void {
    const subCategory = this.editSubCategoriesArray.at(index).value;
    if (subCategory.name) {
      this.subToDelete = { name: subCategory.name, index: index, source: 'edit' };
      this.showSubDeleteModal = true;
    } else {
      this.editSubCategoriesArray.removeAt(index);
    }
  }

  confirmDeleteSub(name: string, index: number, source: 'edit' | 'structure'): void {
    this.subToDelete = { name, index, source };
    this.showSubDeleteModal = true;
  }

  cancelDeleteSub(): void {
    this.showSubDeleteModal = false;
    this.subToDelete = null;
  }

  executeDeleteSub(): void {
    if (!this.subToDelete) return;
    const { name, index, source } = this.subToDelete;

    this.loading = true;
    this.apiService.deleteSubcategories([name]).subscribe({
      next: () => {
        if (source === 'edit') {
          this.editSubCategoriesArray.removeAt(index);
        } else {
          this.subCategoriesFormArray.removeAt(index);
        }
        this.loading = false;
        this.showAlert('Subcategory deleted', 'success');
        this.loadGlobalData(); // Refresh all data to keep UI in sync
        this.cancelDeleteSub();
      },
      error: () => {
        this.loading = false;
        this.showAlert('Failed to delete subcategory', 'error');
        this.cancelDeleteSub();
      }
    });
  }

  onUpdateCategory(): void {
    if (this.editForm.invalid) {
      this.showAlert('Please fill all required fields.', 'error');
      return;
    }

    const formVal = this.editForm.getRawValue();
    const categoryRequest: CategoryRequest = {
      id: formVal.id,
      type: formVal.type,
      category: formVal.category,
      amount: formVal.amount,
      subcategories: formVal.subCategories.map((s: any) => s.name)
    };

    const [year, month] = this.currentMonthYear.split('-').map(Number);
    const plannerData = new Planner(
      formVal.id,
      0,
      year,
      month.toString(),
      formVal.category,
      formVal.type,
      formVal.amount,
      "",
      true
    );

    this.loading = true;
    // Step 1: Update Global Category
    this.apiService.createCategory(categoryRequest).subscribe({
      next: () => {
        // Step 2: Update Monthly Planner
        this.apiService.createPlanner(plannerData).subscribe({
          next: () => {
            this.showAlert('Category and Projection updated!', 'success');
            this.loadGlobalData();
            this.closeEditModal();
          },
          error: () => {
            this.loading = false;
            this.showAlert('Category updated, but projection failed.', 'error');
          }
        });
      },
      error: () => {
        this.loading = false;
        this.showAlert('Failed to update category.', 'error');
      }
    });
  }

  confirmDeleteCategory(cat: Category): void {
    this.categoryToDelete = cat;
    this.showDeleteModal = true;
  }

  cancelDeleteCategory(): void {
    this.showDeleteModal = false;
    this.categoryToDelete = undefined;
  }

  executeDeleteCategory(): void {
    if (!this.categoryToDelete) return;

    this.loading = true;
    this.apiService.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        this.showAlert('Category deleted successfully', 'success');
        this.loadGlobalData();
        this.cancelDeleteCategory();
      },
      error: () => {
        this.loading = false;
        this.showAlert('Failed to delete category', 'error');
        this.cancelDeleteCategory();
      }
    });
  }

  processCategoryRecords(categories: Category[], planners: PlannerDTO[]) {
    let income: number = 0;
    let spent: number = 0;

    this.incomeCategories = [];
    this.savingsCategories = [];
    this.investmentsCategories = [];
    this.expenseCategories = [];

    // Map categories and override amount with monthly projected value if available
    const displayCategories = categories.map(cat => {
      const planner = planners.find(p => p.baseId === cat.id || p.category === cat.category);
      return {
        ...cat,
        amount: planner ? planner.projected : 0 // Show 0 if no projection for this month
      };
    });

    for (let cat of displayCategories) {
      const type = cat.type.toUpperCase();
      if (type === 'INCOME') {
        this.incomeCategories.push(cat);
        income += cat.amount;
      } else if (type === 'SAVING' || type === 'SAVINGS') {
        this.savingsCategories.push(cat);
        spent += cat.amount;
      } else if (type === 'INVESTMENT' || type === 'INVESTMENTS') {
        this.investmentsCategories.push(cat);
        spent += cat.amount;
      } else if (type === 'EXPENSE' || type === 'EXPENSES') {
        this.expenseCategories.push(cat);
        spent += cat.amount;
      }
    }
    this.remainingBalanceToPlan = income - spent;
  }

  getMonthlyCategoriesByType(type: string): Category[] {
    switch (type.toUpperCase()) {
      case 'INCOME': return this.incomeCategories;
      case 'SAVING': return this.savingsCategories;
      case 'INVESTMENT': return this.investmentsCategories;
      case 'EXPENSE': return this.expenseCategories;
      default: return [];
    }
  }

  updateProjectionCategories() {
    const selectedType = this.projectionForm.value.type;
    this.categoriesForTypeSet = new Set(
      this.allCategories
        .filter(c => c.type.toUpperCase() === selectedType.toUpperCase())
        .map(c => c.category)
    );

    // Enable fields if type is selected
    if (selectedType) {
      this.projectionForm.controls['category'].enable();
      this.projectionForm.controls['amount'].enable();
    }
  }

  // ========================================
  // PROJECTION FORM ACTIONS
  // ========================================

  get projectionSubcategoriesArray(): FormArray {
    return this.projectionForm.get('subCategories') as FormArray;
  }

  addProjectionSubCategory(): void {
    this.projectionSubcategoriesArray.push(this.fb.group({
      name: ['', Validators.required]
    }));
  }

  removeProjectionSubCategory(index: number): void {
    this.projectionSubcategoriesArray.removeAt(index);
  }

  saveProjection() {
    if (this.projectionForm.invalid) {
      this.showAlert('Please fill all required fields.', 'error');
      return;
    }

    if (this.projectionSubcategoriesArray.length === 0) {
      this.showAlert('At least one subcategory is required.', 'error');
      return;
    }

    let entry = this.projectionForm.getRawValue();
    this.showHigherAmountAlert = false;

    if (entry.amount > this.remainingBalanceToPlan && entry.type !== 'INCOME') {
      this.showHigherAmountAlert = true;
      return;
    }

    // Find existing category to get ID if it exists (upsert)
    const existingCat = this.allCategories.find(c =>
      c.category === entry.category && c.type.toUpperCase() === entry.type.toUpperCase()
    );

    // Call createCategory as requested
    const categoryRequest: CategoryRequest = {
      id: existingCat ? (existingCat.id || 0) : 0,
      type: entry.type.charAt(0) + entry.type.slice(1).toUpperCase(),
      category: entry.category,
      amount: entry.amount,
      subcategories: entry.subCategories.map((s: any) => s.name)
    };

    this.loading = true;
    this.apiService.createCategory(categoryRequest).subscribe({
      next: () => {
        this.loadGlobalData();
        this.projectionForm.reset({ month: this.currentMonthYear });
        this.projectionSubcategoriesArray.clear();
        this.showProjectionForm = false;
        this.loading = false;
        this.showAlert('Budget entry and category saved', 'success');
      },
      error: () => {
        this.loading = false;
        this.showAlert('Failed to save category', 'error');
      }
    });
  }

  // ========================================
  // BUDGET STRUCTURE LOGIC
  // ========================================

  filterCategoriesByType(type: string): void {
    this.filteredCategories = this.allCategories.filter(c => c.type.toLowerCase() === type.toLowerCase());
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
    const category = this.allCategories.find(c => c.id?.toString() === id);
    if (category) {
      this.structureForm.patchValue({
        categoryName: category.category,
        categoryAmount: category.amount
      }, { emitEvent: false });

      this.subCategoriesFormArray.clear();
      category.subCategories.forEach(subName => {
        this.subCategoriesFormArray.push(this.fb.group({
          name: [subName, Validators.required]
        }));
      });
    }
  }

  addSubCategory(): void {
    this.subCategoriesFormArray.push(this.fb.group({
      name: ['', Validators.required]
    }));
  }

  removeSubCategory(index: number): void {
    const subCategory = this.subCategoriesFormArray.at(index).value;
    if (this.creationMode === 'existing' && subCategory.name) {
      this.subToDelete = { name: subCategory.name, index: index, source: 'structure' };
      this.showSubDeleteModal = true;
    } else {
      this.subCategoriesFormArray.removeAt(index);
    }
  }

  onStructureSubmit(): void {
    if (this.structureForm.invalid || this.subCategoriesFormArray.length === 0) {
      this.showAlert('Please fill all fields.', 'error');
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
        this.showAlert('Saved!', 'success');
        this.loadGlobalData();
        this.resetStructureSelection();
      },
      error: () => {
        this.loading = false;
        this.showAlert('Failed to save.', 'error');
      }
    });
  }

  deleteCategoryStructure(): void {
    const id = this.structureForm.get('selectedCategoryId')?.value;
    const category = this.allCategories.find(c => c.id?.toString() === id);
    if (category) {
      this.confirmDeleteCategory(category);
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
    this.getMonthlyCategoriesByType(type).forEach(c => total += c.amount);
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
      this.loadGlobalData();
    }
  }
}
