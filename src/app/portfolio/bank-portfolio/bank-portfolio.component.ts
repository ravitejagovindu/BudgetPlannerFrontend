import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { ApiService, ApiResponse } from '../../service/api.service';
import { Portfolio } from '../../model/portfolio';

@Component({
    selector: 'app-bank-portfolio',
    standalone: false,
    templateUrl: './bank-portfolio.component.html',
    styleUrls: ['./bank-portfolio.component.css']
})
export class BankPortfolioComponent implements OnInit, OnChanges {
    @Input() allPortfolios: Portfolio[] = [];
    @Output() edit = new EventEmitter<Portfolio>();
    @Output() delete = new EventEmitter<Portfolio>();
    bankAccounts: Portfolio[] = [];
    fixedDeposits: Portfolio[] = [];
    recurringDeposits: Portfolio[] = [];
    loading: boolean = false;

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.filterData();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['allPortfolios']) {
            this.filterData();
        }
    }

    filterData() {
        if (this.allPortfolios) {
            this.bankAccounts = this.allPortfolios.filter((p: Portfolio) =>
                p.type.toUpperCase() === 'SAVINGS' || p.type.toUpperCase() === 'BANK' || p.type.toUpperCase() === 'SAVINGS ACCOUNT');
            this.fixedDeposits = this.allPortfolios.filter((p: Portfolio) =>
                p.type.toUpperCase() === 'FD' || p.type.toUpperCase() === 'FIXED DEPOSIT' || p.type.toUpperCase() === 'FIXED_DEPOSIT');
            this.recurringDeposits = this.allPortfolios.filter((p: Portfolio) =>
                p.type.toUpperCase() === 'RD' || p.type.toUpperCase() === 'RECURRING DEPOSIT' || p.type.toUpperCase() === 'RECURRING_DEPOSIT');
        }
    }

    onEdit(portfolio: Portfolio) {
        this.edit.emit(portfolio);
    }

    onDelete(portfolio: Portfolio) {
        this.delete.emit(portfolio);
    }


    getTotalBalance(): number {
        return this.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    }

    getTotalDeposits(): number {
        const fdTotal = this.fixedDeposits.reduce((sum, fd) => sum + fd.balance, 0);
        const rdTotal = this.recurringDeposits.reduce((sum, rd) => sum + rd.balance, 0);
        return fdTotal + rdTotal;
    }
}
