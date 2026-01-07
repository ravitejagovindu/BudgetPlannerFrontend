import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../service/api.service';

@Component({
    selector: 'app-bank-portfolio',
    standalone: false,
    templateUrl: './bank-portfolio.component.html',
    styleUrls: ['./bank-portfolio.component.css']
})
export class BankPortfolioComponent implements OnInit {
    bankAccounts: any[] = [];
    fixedDeposits: any[] = [];
    recurringDeposits: any[] = [];
    loading: boolean = true;

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.loadBankData();
    }

    loadBankData() {
        this.loading = true;
        this.apiService.getBankAccounts().subscribe({
            next: (res) => {
                this.bankAccounts = res.data;
                this.apiService.getFixedDeposits().subscribe({
                    next: (res) => {
                        this.fixedDeposits = res.data;
                        this.apiService.getRecurringDeposits().subscribe({
                            next: (res) => {
                                this.recurringDeposits = res.data;
                                this.loading = false;
                            },
                            error: () => this.loading = false
                        });
                    },
                    error: () => this.loading = false
                });
            },
            error: () => this.loading = false
        });
    }

    getTotalBalance(): number {
        return this.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    }

    getTotalDeposits(): number {
        const fdTotal = this.fixedDeposits.reduce((sum, fd) => sum + fd.principal, 0);
        const rdTotal = this.recurringDeposits.reduce((sum, rd) => sum + rd.accumulatedAmount, 0);
        return fdTotal + rdTotal;
    }
}
