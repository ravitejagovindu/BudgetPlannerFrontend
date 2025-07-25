import { Component, OnInit } from '@angular/core';
import { Ledger } from '../model/ledger';
import { ApiService } from '../service/api.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-ledger',
  standalone: false,
  templateUrl: './ledger.component.html',
  styleUrl: './ledger.component.css'
})
export class LedgerComponent implements OnInit {
  date = new Date();
  month = this.date.getMonth() + 1;
  year = this.date.getFullYear();
  currentMonthYear = `${this.year}-${this.month < 10 ? '0' : ''}${this.month}`;
  minDate: any;
  maxDate: any;

  ledgerEntry: FormGroup = new FormGroup({
    date: new FormControl(null, Validators.required),
    type: new FormControl('', Validators.required),
    category: new FormControl('', Validators.required),
    subCategory: new FormControl('', Validators.required),
    amount: new FormControl(null, Validators.required),
  });

  records: Map<number,any>= new Map();

  categories: Set<string> | undefined;
  subCategories: string[] | undefined;

  allData: any;
  allTypes: Map<string, Set<string>> = new Map();
  allCategories: Map<string, string[]> = new Map();

  constructor(private apiService: ApiService) {
    this.ledgerEntry.controls['category'].disable();
    this.ledgerEntry.controls['subCategory'].disable();
    this.ledgerEntry.controls['amount'].disable();
  }

  ngOnInit(): void {
    this.getMinAndMaxDate();
    this.apiService.getAllBudgetTypes().subscribe((response) => {
      this.allData = response.data;
      this.populateTypesAndCategoriesDropdowns(this.allData);
      this.populateCategoriesAndSubCategoriesDropdowns(this.allData);
    });
    this.populateLedgers(this.currentMonthYear);
  }

  getMinAndMaxDate() {
    let temp = new Date(this.year, this.month, 0);
    this.minDate = `${this.currentMonthYear}-01`;
    this.maxDate = `${this.currentMonthYear}-${temp.getDate()}`;
  }

  populateLedgers(monthYear: string) {
    this.records = new Map();
    let selectedMonth = parseInt(monthYear.split('-')[1]);
    let selectedYear = parseInt(monthYear.split('-')[0]);
    this.getMinAndMaxDate();
    this.apiService
      .getAllLedgersByMonthAndYear(selectedYear, selectedMonth)
      .subscribe((response) => {
        for(let item of response.data){
          this.records.set(item.id,item);
        }
      });
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

  populateCategoriesAndSubCategoriesDropdowns(allData: any) {
    this.allCategories = new Map();
    for (let data of allData) {
      let subCategories = this.allCategories.get(data.category);
      if (!subCategories) {
        subCategories = [];
      }
      subCategories.push(...('' + data.subCategories).split(','));
      this.allCategories.set(data.category, subCategories);
    }
  }

  showDropdowns() {
    let selectedType = this.ledgerEntry.value.type;
    this.categories = this.allTypes.get(selectedType);
    let currentCategory = this.categories?.values().next().value;
    if (!currentCategory) {
      return;
    }
    this.ledgerEntry.controls['category'].setValue(currentCategory);
    this.ledgerEntry.controls['category'].enable();
    this.showSubCategories();
  }

  showSubCategories() {
    let selectedCategory = this.ledgerEntry.value.category;
    this.subCategories = this.allCategories.get(selectedCategory);
    this.ledgerEntry.controls['subCategory'].setValue(
      this.subCategories ? this.subCategories[0] : ''
    );
    this.ledgerEntry.controls['subCategory'].enable();
    this.ledgerEntry.controls['amount'].enable();
  }

  saveLedger() {
    let formData = this.ledgerEntry.value;
    let selectedMonth = parseInt(this.currentMonthYear.split('-')[1]);
    let selectedYear = parseInt(this.currentMonthYear.split('-')[0]);
    let ledger = new Ledger(
      0,
      selectedYear,
      selectedMonth.toString(),
      formData.date,
      formData.type,
      formData.category,
      formData.subCategory,
      formData.amount
    );
    this.apiService
      .createLedger(ledger)
      .subscribe((response) => this.populateLedgers(this.currentMonthYear));
  }

  updateLedger(ledger: Ledger) {
    ledger.canEdit = !ledger.canEdit;
    if (!ledger.canEdit) {
      this.apiService
        .updateLedger(ledger.id, ledger)
        .subscribe((response) => this.records.set(ledger.id,ledger));
    }
  }

  deleteLedger(ledger: Ledger) {
    if (!ledger.canEdit) {
      this.apiService
        .deleteLedger(ledger.id)
        .subscribe((response) => this.records.delete(ledger.id));
    } else {
      ledger.canEdit = !ledger.canEdit;
    }
  }
}
