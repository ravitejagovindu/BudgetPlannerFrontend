import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApiService, ApiResponse } from '../service/api.service';
import { Portfolio } from '../model/portfolio';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-portfolio',
  standalone: false,
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent implements OnInit {
  activeTab: 'bank' | 'demat' = 'bank';
  allPortfolios: Portfolio[] = [];
  isSticky: boolean = false;

  @ViewChild('stickySentinel') stickySentinel!: ElementRef;

  // CRUD State
  showModal: boolean = false;
  showDeleteModal: boolean = false;
  editingPortfolio: Portfolio | null = null;
  itemToDelete: Portfolio | null = null;
  portfolioForm: FormGroup;
  loading: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'success';

  portfolioTypes: string[] = ['SAVINGS', 'FD', 'RD', 'MUTUAL FUND', 'NPS', 'PPF'];

  get totalNetWorth(): number {
    return this.allPortfolios.reduce((sum, p) => sum + (p.balance || 0), 0);
  }

  get bankBalance(): number {
    return this.allPortfolios
      .filter(p => {
        const type = p.type.toUpperCase();
        return type === 'SAVINGS' || type === 'BANK' || type === 'SAVINGS ACCOUNT';
      })
      .reduce((sum, p) => sum + (p.balance || 0), 0);
  }

  get totalDeposits(): number {
    return this.allPortfolios
      .filter(p => {
        const type = p.type.toUpperCase();
        return type === 'FD' || type === 'FIXED DEPOSIT' || type === 'FIXED_DEPOSIT' ||
          type === 'RD' || type === 'RECURRING DEPOSIT' || type === 'RECURRING_DEPOSIT';
      })
      .reduce((sum, p) => sum + (p.balance || 0), 0);
  }

  get otherInvestments(): number {
    return this.allPortfolios
      .filter(p => {
        const type = p.type.toUpperCase();
        return type === 'NPS' || type === 'PPF' || type === 'MUTUAL FUND' || type === 'MF';
      })
      .reduce((sum, p) => sum + (p.balance || 0), 0);
  }

  get totalInvestments(): number {
    return this.totalDeposits + this.otherInvestments;
  }

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.portfolioForm = this.fb.group({
      type: ['', Validators.required],
      code: ['', Validators.required],
      name: ['', Validators.required],
      balance: [0, [Validators.required, Validators.min(0)]],
      startDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadAllPortfolios();
  }

  ngAfterViewInit(): void {
    this.initStickyObserver();
  }

  private initStickyObserver() {
    const observer = new IntersectionObserver(
      ([e]) => {
        // Only update if it actually changes to prevent jitter
        if (this.isSticky !== (e.intersectionRatio < 1)) {
          this.isSticky = e.intersectionRatio < 1;
        }
      },
      { threshold: [1], rootMargin: '0px' }
    );

    if (this.stickySentinel) {
      observer.observe(this.stickySentinel.nativeElement);
    }
  }

  loadAllPortfolios() {
    this.loading = true;
    this.apiService.getAllPortfolios().subscribe((res: ApiResponse<Portfolio[]>) => {
      this.allPortfolios = res.data || [];
      this.loading = false;
    }, (error) => {
      console.error('Error fetching all portfolios', error);
      this.showAlert('Failed to load portfolio data', 'error');
      this.loading = false;
    });
  }

  // CRUD Methods
  openAddModal() {
    this.editingPortfolio = null;
    this.portfolioForm.reset({ balance: 0, type: '' });
    this.showModal = true;
  }

  openEditModal(portfolio: Portfolio) {
    this.editingPortfolio = portfolio;
    this.portfolioForm.patchValue(portfolio);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingPortfolio = null;
  }

  savePortfolio() {
    if (this.portfolioForm.invalid) return;

    const portfolioData: Portfolio = this.portfolioForm.value;
    this.loading = true;

    if (this.editingPortfolio && this.editingPortfolio.id) {
      // Update
      this.apiService.updatePortfolio(this.editingPortfolio.id, portfolioData).subscribe({
        next: () => {
          this.showAlert('Portfolio updated successfully', 'success');
          this.loadAllPortfolios();
          this.closeModal();
        },
        error: () => {
          this.showAlert('Failed to update portfolio', 'error');
          this.loading = false;
        }
      });
    } else {
      // Create
      this.apiService.createPortfolio(portfolioData).subscribe({
        next: () => {
          this.showAlert('Portfolio created successfully', 'success');
          this.loadAllPortfolios();
          this.closeModal();
        },
        error: () => {
          this.showAlert('Failed to create portfolio', 'error');
          this.loading = false;
        }
      });
    }
  }

  deletePortfolio(portfolio: Portfolio | number | undefined) {
    if (!portfolio) return;

    // If we receive a number (from older event emitters), find it or just use the ID
    // But we prefer the object for the confirmation text
    if (typeof portfolio === 'number') {
      this.itemToDelete = this.allPortfolios.find(p => p.id === portfolio) || null;
    } else {
      this.itemToDelete = portfolio;
    }

    if (this.itemToDelete) {
      this.showDeleteModal = true;
    }
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  confirmDelete() {
    if (!this.itemToDelete || !this.itemToDelete.id) return;

    this.showDeleteModal = false;
    this.loading = true;
    const id = this.itemToDelete.id;

    this.apiService.deletePortfolio(id).subscribe({
      next: () => {
        this.showAlert('Portfolio deleted successfully', 'success');
        this.loadAllPortfolios();
        this.itemToDelete = null;
      },
      error: () => {
        this.showAlert('Failed to delete portfolio', 'error');
        this.loading = false;
        this.itemToDelete = null;
      }
    });
  }

  showAlert(message: string, type: 'success' | 'error') {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.alertMessage = '', 5000);
  }

  setActiveTab(tab: 'bank' | 'demat') {
    this.activeTab = tab;
  }
}
