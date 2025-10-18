import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import { ApiService } from '../../service/api.service';

export interface Category {
  id?: number;
  budgetType: string;
  categoryName: string;
  categoryAmount: number;
  subCategories: string[];
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

  categoryForm!: FormGroup;
  existingCategoryForm!: FormGroup;

  loading: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'success';

  constructor(private fb: FormBuilder, private apiService: ApiService) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadAllCategories();
  }

  initializeForms(): void {
    // Form for adding new category
    this.categoryForm = this.fb.group({
      budgetType: ['', Validators.required],
      categoryName: ['', Validators.required],
      categoryAmount: ['', [Validators.required, Validators.min(0.01)]],
      subCategories: this.fb.array([new FormControl('', Validators.required)]),
    });

    // Form for adding subcategories to existing category
    this.existingCategoryForm = this.fb.group({
      selectedCategoryId: ['', Validators.required],
      newSubCategories: this.fb.array([
        new FormControl('', Validators.required),
      ]),
    });
  }

  get subCategories(): FormArray {
    return this.categoryForm.get('subCategories') as FormArray;
  }

  get newSubCategories(): FormArray {
    return this.existingCategoryForm.get('newSubCategories') as FormArray;
  }

  addSubCategory(): void {
    this.subCategories.push(new FormControl('', Validators.required));
  }

  removeSubCategory(index: number): void {
    if (this.subCategories.length > 1) {
      this.subCategories.removeAt(index);
    }
  }

  addNewSubCategory(): void {
    this.newSubCategories.push(new FormControl('', Validators.required));
  }

  removeNewSubCategory(index: number): void {
    if (this.newSubCategories.length > 1) {
      this.newSubCategories.removeAt(index);
    }
  }

  onSubmitNewCategory(): void {
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.categoryForm);

    if (this.categoryForm.invalid) {
      this.showAlert('Please fill in all required fields correctly.', 'error');
      return;
    }

    // Validate at least one subcategory
    if (this.subCategories.length === 0) {
      this.showAlert('At least one subcategory is required.', 'error');
      return;
    }

    // Check if all subcategories have values
    const hasEmptySubcategory = this.subCategories.value.some(
      (sub: string) => !sub || sub.trim() === ''
    );
    if (hasEmptySubcategory) {
      this.showAlert('All subcategories must have a name.', 'error');
      return;
    }

    const categoryData: Category = {
      budgetType: this.categoryForm.value.budgetType,
      categoryName: this.categoryForm.value.categoryName,
      categoryAmount: this.categoryForm.value.categoryAmount,
      subCategories: this.subCategories.value.filter(
        (sub: string) => sub && sub.trim() !== ''
      ),
    };

    this.loading = true;

    // Call API service to create category
    this.apiService.createCategory(categoryData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.showAlert(
          `Category "${categoryData.categoryName}" created successfully with ${categoryData.subCategories.length} subcategories!`,
          'success'
        );

        // Reset form
        this.categoryForm.reset();
        this.subCategories.clear();
        this.subCategories.push(new FormControl('', Validators.required));

        // Reload categories
        this.loadAllCategories();
      },
      error: (error: any) => {
        this.loading = false;
        this.showAlert('Failed to create category. Please try again.', 'error');
        console.error('Error creating category:', error);
      },
    });
  }

  onSubmitExistingCategory(): void {
    // Mark all fields as touched
    this.markFormGroupTouched(this.existingCategoryForm);

    if (this.existingCategoryForm.invalid) {
      this.showAlert(
        'Please select a category and add at least one subcategory.',
        'error'
      );
      return;
    }

    if (this.newSubCategories.length === 0) {
      this.showAlert('Please add at least one subcategory.', 'error');
      return;
    }

    // Check if all subcategories have values
    const hasEmptySubcategory = this.newSubCategories.value.some(
      (sub: string) => !sub || sub.trim() === ''
    );
    if (hasEmptySubcategory) {
      this.showAlert('All subcategories must have a name.', 'error');
      return;
    }

    const categoryId = this.existingCategoryForm.value.selectedCategoryId;
    const subcategories = this.newSubCategories.value.filter(
      (sub: string) => sub && sub.trim() !== ''
    );

    this.loading = true;

    // Call API service to add subcategories
    this.apiService
      .addSubCategoriesToCategory(categoryId, subcategories)
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          const selectedCategory = this.allCategories.find(
            (cat) => cat.id?.toString() === categoryId
          );
          this.showAlert(
            `Successfully added ${subcategories.length} subcategories to "${selectedCategory?.categoryName}"!`,
            'success'
          );

          // Reset form
          this.existingCategoryForm.reset();
          this.newSubCategories.clear();
          this.newSubCategories.push(new FormControl('', Validators.required));

          // Reload categories
          this.loadAllCategories();
        },
        error: (error: any) => {
          this.loading = false;
          this.showAlert(
            'Failed to add subcategories. Please try again.',
            'error'
          );
          console.error('Error adding subcategories:', error);
        },
      });
  }

  loadAllCategories(): void {
    // Call API service to get all categories
    this.apiService.getAllCategories().subscribe({
      next: (response: any) => {
        this.allCategories = response;
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.allCategories = [];
      },
    });
  }

  showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.closeAlert();
    }, 5000);
  }

  closeAlert(): void {
    this.alertMessage = '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((ctrl) => {
          ctrl.markAsTouched();
        });
      }
    });
  }
}
