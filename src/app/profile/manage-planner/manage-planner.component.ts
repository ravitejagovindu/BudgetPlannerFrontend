import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ApiService } from '../../service/api.service';

/* Data Models */
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
  selector: 'app-manage-planner',
  standalone: false,
  templateUrl: './manage-planner.component.html',
  styleUrl: './manage-planner.component.css',
})
export class ManagePlannerComponent implements OnInit {
  budgetTypes: string[] = ['Income', 'Expense', 'Investments', 'Savings'];
  allCategories: Category[] = [];
  filteredCategories: Category[] = [];

  // Main Form
  plannerForm!: FormGroup;

  // UI State State
  loading: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'success';

  // Selection State
  selectedType: string = '';
  creationMode: 'existing' | 'new' = 'existing';
  selectedCategoryIndex: number = -1; // Index in filteredCategories

  constructor(private fb: FormBuilder, private apiService: ApiService) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadAllCategories();
  }

  initializeForm(): void {
    this.plannerForm = this.fb.group({
      budgetType: ['', Validators.required],
      creationMode: ['existing'], // 'existing' or 'new'

      // Existing Category Selection
      selectedCategoryId: [''],

      // New/Edit Category Fields
      categoryName: ['', Validators.required],
      categoryAmount: ['', [Validators.required, Validators.min(1)]],

      // Subcategories
      subCategories: this.fb.array([])
    });

    // Watch for Type changes
    this.plannerForm.get('budgetType')?.valueChanges.subscribe(type => {
      this.selectedType = type;
      this.filterCategories(type);
      this.resetSelection();
    });

    // Watch for Mode changes
    this.plannerForm.get('creationMode')?.valueChanges.subscribe(mode => {
      this.creationMode = mode;
      this.resetSelection();
      if (mode === 'new') {
        // Enable Name field
        this.plannerForm.get('categoryName')?.enable();
        this.plannerForm.get('categoryName')?.reset();
        this.plannerForm.get('categoryAmount')?.reset();
        this.subCategories.clear();
        this.addSubCategory(); // Add initial empty subcategory
      } else {
        // Disable Name field initially until a category is picked
        this.plannerForm.get('categoryName')?.disable();
      }
    });

    // Watch for Existing Category Selection
    this.plannerForm.get('selectedCategoryId')?.valueChanges.subscribe(id => {
      if (this.creationMode === 'existing' && id) {
        this.selectCategory(id);
      }
    });
  }

  get subCategories(): FormArray {
    return this.plannerForm.get('subCategories') as FormArray;
  }

  /* Loaders */
  loadAllCategories(): void {
    this.loading = true;
    this.apiService.getAllCategories().subscribe({
      next: (response: any) => {
        this.allCategories = response;
        this.loading = false;
        // Re-filter if type is selected
        if (this.selectedType) {
          this.filterCategories(this.selectedType);
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error loading categories', error);
        this.showAlert('Failed to load categories', 'error');
      }
    });
  }

  filterCategories(type: string): void {
    this.filteredCategories = this.allCategories.filter(c => c.budgetType === type);
  }

  /* Selection Logic */
  resetSelection(): void {
    this.selectedCategoryIndex = -1;
    this.plannerForm.patchValue({
      selectedCategoryId: '',
      categoryName: '',
      categoryAmount: ''
    }, { emitEvent: false });

    // reset subcategories
    this.subCategories.clear();

    if (this.creationMode === 'existing') {
      this.plannerForm.get('categoryName')?.disable(); // Name is read-only for existing
    } else {
      this.plannerForm.get('categoryName')?.enable();
    }
  }

  selectCategory(id: string): void {
    const category = this.filteredCategories.find(c => c.id?.toString() == id);
    if (category) {
      this.selectedCategoryIndex = category.id || -1;

      // Populate form
      this.plannerForm.patchValue({
        categoryName: category.categoryName,
        categoryAmount: category.categoryAmount
      }, { emitEvent: false });

      // Populate Subcategories
      this.subCategories.clear();
      if (category.subCategories && category.subCategories.length > 0) {
        category.subCategories.forEach(sub => {
          this.subCategories.push(this.fb.group({
            name: [sub.name, Validators.required],
            amount: [sub.amount, [Validators.required, Validators.min(1)]]
          }));
        });
      } else {
        // Should not happen based on rules, but just in case
        this.addSubCategory();
      }
    }
  }

  /* Subcategory Management */
  addSubCategory(): void {
    this.subCategories.push(this.fb.group({
      name: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]]
    }));
  }

  removeSubCategory(index: number): void {
    this.subCategories.removeAt(index);
  }

  /* Form Submission */
  onSubmit(): void {
    if (this.plannerForm.invalid) {
      this.markFormGroupTouched(this.plannerForm);
      this.showAlert('Please fill in all required fields.', 'error');
      return;
    }

    const formVal = this.plannerForm.getRawValue(); // Use getRawValue to include disabled fields

    // Custom Validation: At least one subcategory
    if (this.subCategories.length === 0) {
      this.showAlert('At least one subcategory is mandatory.', 'error');
      return;
    }

    // Prepare Data
    const categoryData: Category = {
      id: this.creationMode === 'existing' ? parseInt(formVal.selectedCategoryId) : undefined,
      budgetType: formVal.budgetType,
      categoryName: formVal.categoryName,
      categoryAmount: formVal.categoryAmount,
      subCategories: formVal.subCategories
    };

    this.loading = true;

    if (this.creationMode === 'new') {
      this.apiService.createCategory(categoryData).subscribe({
        next: (res: any) => this.handleSuccess('Category created successfully!'),
        error: (err: any) => this.handleError('Failed to create category.')
      });
    } else {
      this.apiService.updateCategory(categoryData.id, categoryData).subscribe({
        next: (res: any) => this.handleSuccess('Category updated successfully!'),
        error: (err: any) => this.handleError('Failed to update category.')
      });
    }
  }

  deleteCategory(): void {
    if (confirm('Are you sure you want to delete this category? This cannot be undone.')) {
      const id = this.plannerForm.get('selectedCategoryId')?.value;
      if (id) {
        this.loading = true;
        this.apiService.deleteCategory(id).subscribe({
          next: () => {
            this.loading = false;
            this.showAlert('Category deleted.', 'success');
            this.loadAllCategories();
            this.resetSelection();
          },
          error: () => {
            this.loading = false;
            this.showAlert('Failed to delete category.', 'error');
          }
        });
      }
    }
  }

  /* Helpers */
  handleSuccess(msg: string): void {
    this.loading = false;
    this.showAlert(msg, 'success');
    this.loadAllCategories();
    this.resetSelection();
    // Keep mode but reset fields
    if (this.creationMode === 'new') {
      this.subCategories.clear();
      this.addSubCategory();
    }
  }

  handleError(msg: string): void {
    this.loading = false;
    this.showAlert(msg, 'error');
  }

  showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 5000);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormArray) {
        control.controls.forEach(ctrl => this.markFormGroupTouched(ctrl as FormGroup));
      }
    });
  }
}
