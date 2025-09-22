import { Component, OnInit } from '@angular/core';
import { Ledger } from '../model/ledger';
import { ApiService } from '../service/api.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-ledger',
  standalone: false,
  templateUrl: './ledger.component.html',
  styleUrl: './ledger.component.css',
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
    paidBy: new FormControl('', Validators.required),
  });

  records: Map<number, any> = new Map();
  filteredRecords: any[] = [];

  categories: Set<string> | undefined;
  subCategories: string[] | undefined;
  paymentModes: Set<string> | undefined;

  allData: any;
  allTypes: Map<string, Set<string>> = new Map();
  allCategories: Map<string, string[]> = new Map();

  // Filter and Sort properties
  filterText: string = '';
  filterType: string = '';
  filterCategory: string = '';
  filterSubCategory: string = '';
  filterPaidBy: string = '';
  sortColumn: string = 'date'; // Default sort by date
  sortDirection: 'asc' | 'desc' = 'desc'; // Latest dates first

  // Available options for filtering
  availableTypes: string[] = [];
  availableCategories: string[] = [];
  availableSubCategories: string[] = [];
  availablePaidBy: string[] = [];

  constructor(private apiService: ApiService) {
    this.ledgerEntry.controls['category'].disable();
    this.ledgerEntry.controls['subCategory'].disable();
    this.ledgerEntry.controls['amount'].disable();
    this.ledgerEntry.controls['paidBy'].disable();
  }

  ngOnInit(): void {
    this.getMinAndMaxDate();
    this.apiService.getAllPaidBys().subscribe((response) => {
      this.populatePaidByDropdown(response.data.modes);
    });
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
        for (let item of response.data) {
          this.records.set(item.id, item);
        }
        this.updateFilteredRecords();
        this.extractFilterOptions();
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

  populatePaidByDropdown(modes: any) {
    this.paymentModes = new Set();
    for (let mode of modes) {
      console.log(mode);
      let paidBy = mode;
      this.paymentModes.add(paidBy);
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
    this.ledgerEntry.controls['paidBy'].enable();
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
      formData.amount,
      formData.paidBy
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
        .subscribe((response) => {
          this.records.set(ledger.id, ledger);
          this.updateFilteredRecords();
        });
    }
  }

  deleteLedger(ledger: Ledger) {
    if (!ledger.canEdit) {
      this.apiService
        .deleteLedger(ledger.id)
        .subscribe((response) => {
          this.records.delete(ledger.id);
          this.updateFilteredRecords();
        });
    } else {
      ledger.canEdit = !ledger.canEdit;
    }
  }

  // Filter and Sort Methods
  extractFilterOptions() {
    const recordsArray = Array.from(this.records.values());
    this.availableTypes = [...new Set(recordsArray.map(r => r.type))].sort();
    this.updateCascadingFilterOptions();
  }

  updateCascadingFilterOptions() {
    const recordsArray = Array.from(this.records.values());

    // Filter by type first if selected
    let filteredForCategories = recordsArray;
    if (this.filterType) {
      filteredForCategories = recordsArray.filter(r => r.type === this.filterType);
    }

    this.availableCategories = [...new Set(filteredForCategories.map(r => r.category))].sort();

    // Filter by category if selected
    let filteredForSubCategories = filteredForCategories;
    if (this.filterCategory) {
      filteredForSubCategories = filteredForCategories.filter(r => r.category === this.filterCategory);
    }

    this.availableSubCategories = [...new Set(filteredForSubCategories.map(r => r.subCategory))].sort();
    this.availablePaidBy = [...new Set(recordsArray.map(r => r.paidBy).filter(p => p))].sort();
  }

  updateFilteredRecords() {
    let records = Array.from(this.records.values());

    // Apply filters
    if (this.filterText.trim()) {
      const searchTerm = this.filterText.toLowerCase();
      records = records.filter(record =>
        record.date.toLowerCase().includes(searchTerm) ||
        record.type.toLowerCase().includes(searchTerm) ||
        record.category.toLowerCase().includes(searchTerm) ||
        record.subCategory.toLowerCase().includes(searchTerm) ||
        (record.paidBy && record.paidBy.toLowerCase().includes(searchTerm)) ||
        record.amount.toString().includes(searchTerm)
      );
    }

    if (this.filterType) {
      records = records.filter(record => record.type === this.filterType);
    }

    if (this.filterCategory) {
      records = records.filter(record => record.category === this.filterCategory);
    }

    if (this.filterSubCategory) {
      records = records.filter(record => record.subCategory === this.filterSubCategory);
    }

    if (this.filterPaidBy) {
      records = records.filter(record => record.paidBy === this.filterPaidBy);
    }

    // Apply sorting
    if (this.sortColumn) {
      records.sort((a, b) => {
        let valueA = a[this.sortColumn];
        let valueB = b[this.sortColumn];

        // Handle numeric sorting for amount
        if (this.sortColumn === 'amount') {
          valueA = parseFloat(valueA) || 0;
          valueB = parseFloat(valueB) || 0;
        } else {
          // String comparison
          valueA = valueA ? valueA.toString().toLowerCase() : '';
          valueB = valueB ? valueB.toString().toLowerCase() : '';
        }

        let comparison = 0;
        if (valueA > valueB) {
          comparison = 1;
        } else if (valueA < valueB) {
          comparison = -1;
        }

        return this.sortDirection === 'desc' ? comparison * -1 : comparison;
      });
    }

    this.filteredRecords = records;
  }

  onFilterChange() {
    // Reset dependent filters when parent filter changes
    if (this.filterType === '') {
      this.filterCategory = '';
      this.filterSubCategory = '';
    }
    if (this.filterCategory === '') {
      this.filterSubCategory = '';
    }

    this.updateCascadingFilterOptions();
    this.updateFilteredRecords();
  }

  onSortChange(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.updateFilteredRecords();
  }

  clearFilters() {
    this.filterText = '';
    this.filterType = '';
    this.filterCategory = '';
    this.filterSubCategory = '';
    this.filterPaidBy = '';
    this.sortColumn = 'date';
    this.sortDirection = 'desc';
    this.updateCascadingFilterOptions();
    this.updateFilteredRecords();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'bi-arrow-down-up';
    }
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  exportLedgerTableToExcel(): void {
    const element = document.getElementById('ledger-table');
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
    const fileName = `${monthName}_${year}_Ledger.xlsx`;

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
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger');
    XLSX.writeFile(wb, fileName);
  }
}
