import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

@Component({
  selector: 'app-manage-planner',
  standalone: false,
  templateUrl: './manage-planner.component.html',
  styleUrl: './manage-planner.component.css',
})
export class ManagePlannerComponent {


  budgetTypes = ['Expense', 'Income', 'Investments', 'Savings'];
  categories: any[] = [];
  categoryForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.categoryForm = this.fb.group({
      budgetType: ['', Validators.required],
      categoryName: ['', Validators.required],
      subCategories: this.fb.array([])
    });
  }

  get subCategories() {
    return this.categoryForm.get('subCategories') as FormArray;
  }

  addSubCategory() {
    this.subCategories.push(this.fb.control('', Validators.required));
  }

  removeSubCategory(index: number) {
    this.subCategories.removeAt(index);
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      this.categories.push({
        budgetType: this.categoryForm.value.budgetType,
        categoryName: this.categoryForm.value.categoryName,
        subCategories: this.categoryForm.value.subCategories
      });
      this.categoryForm.reset();
      this.subCategories.clear();
    }
  }
}

