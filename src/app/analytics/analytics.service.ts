import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../service/api.service';
import { Ledger } from '../model/ledger';

export interface AnalyticsDashboardData {
    totalSpent: number;
    monthlyAverage: number;
    highestCategory: { name: string, amount: number };
    monthlyTrend: { month: string, amount: number }[];
    categoryDistribution: { name: string, y: number }[];
    subCategoryBreakdown: { name: string, y: number }[];
    allCategories: string[];
    categoryBreakdown: { [key: string]: { name: string, y: number }[] };
    categoryMonthlyTrend: { [key: string]: { month: string, amount: number }[] };
}

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {

    constructor(private apiService: ApiService) { }

    getAvailableYears(): Observable<number[]> {
        // Generate ranges from 2020 to current year + 1
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = 2023; i <= currentYear - 1; i++) {
            years.push(i);
        }
        return of(years);
    }

    getAnalyticsData(year: number, type: string = 'EXPENSE', categories: string[] = []): Observable<AnalyticsDashboardData> {
        // We need granular data for all types, so we fetch all 12 months of ledgers
        const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const observables = months.map(month => this.apiService.getAllLedgersByMonthAndYear(year, month));

        return forkJoin(observables).pipe(
            map((responses: any[]) => {
                // Combine all months' data
                const allLedgers = responses.flatMap(r => r.data || []);
                return this.processLedgerData(allLedgers, year, type, categories);
            })
        );
    }

    private processLedgerData(ledgers: any[], year: number, type: string, categories: string[]): AnalyticsDashboardData {
        // Filter by Type
        let filteredLedgers = ledgers.filter(l => l.type === type);

        // Filter by categories if selected
        if (categories && categories.length > 0) {
            filteredLedgers = filteredLedgers.filter(l => categories.includes(l.category));
        }

        const expenseLedgers = filteredLedgers;

        // 1. Total Spent
        const totalSpent = expenseLedgers.reduce((sum, l) => sum + (l.amount || 0), 0);

        // 2. Monthly Average (Divide by 12)
        const monthlyAverage = totalSpent / 12;

        // 3. Category Distribution
        const categoryMap = new Map<string, number>();
        const subCategoryMap = new Map<string, number>();
        const detailedBreakdown: { [key: string]: Map<string, number> } = {};
        const detailedTrend: { [key: string]: Map<string, number> } = {};

        // Pre-fill months to ensure order
        const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

        expenseLedgers.forEach(l => {
            // Category
            const currentCat = categoryMap.get(l.category) || 0;
            categoryMap.set(l.category, currentCat + (l.amount || 0));

            // SubCategory (Global)
            const subKey = l.subCategory || 'Other';
            const currentSub = subCategoryMap.get(subKey) || 0;
            subCategoryMap.set(subKey, currentSub + (l.amount || 0));

            // Detailed Breakdown
            if (!detailedBreakdown[l.category]) {
                detailedBreakdown[l.category] = new Map<string, number>();
            }
            const catSubMap = detailedBreakdown[l.category];
            const currentCatSub = catSubMap.get(subKey) || 0;
            catSubMap.set(subKey, currentCatSub + (l.amount || 0));

            // Detailed Trend (Months per Category)
            if (!detailedTrend[l.category]) {
                detailedTrend[l.category] = new Map<string, number>();
                months.forEach(m => detailedTrend[l.category].set(m, 0));
            }
            const catTrendMap = detailedTrend[l.category];
            const m = l.month.toUpperCase();
            if (catTrendMap.has(m)) {
                catTrendMap.set(m, (catTrendMap.get(m) || 0) + (l.amount || 0));
            }
        });

        const categoryDistribution = Array.from(categoryMap.entries())
            .map(([name, y]) => ({ name, y }))
            .sort((a, b) => b.y - a.y);

        const subCategoryBreakdown = Array.from(subCategoryMap.entries())
            .map(([name, y]) => ({ name, y }))
            .sort((a, b) => b.y - a.y)
            .slice(0, 10); // Top 10

        // Convert detailedBreakdown to array format
        const categoryBreakdown: { [key: string]: { name: string, y: number }[] } = {};
        for (const cat in detailedBreakdown) {
            categoryBreakdown[cat] = Array.from(detailedBreakdown[cat].entries())
                .map(([name, y]) => ({ name, y }))
                .sort((a, b) => b.y - a.y);
        }

        // Convert detailedTrend to array format
        const categoryMonthlyTrend: { [key: string]: { month: string, amount: number }[] } = {};
        for (const cat in detailedTrend) {
            categoryMonthlyTrend[cat] = months.map(m => ({
                month: m,
                amount: detailedTrend[cat].get(m) || 0
            }));
        }

        // 4. Highest Category
        const highestCategory = categoryDistribution.length > 0
            ? { name: categoryDistribution[0].name, amount: categoryDistribution[0].y }
            : { name: 'None', amount: 0 };

        // 5. Monthly Trend
        const monthMap = new Map<string, number>();
        // Pre-fill months to ensure order
        months.forEach(m => monthMap.set(m, 0));

        expenseLedgers.forEach(l => {
            const m = l.month.toUpperCase(); // Ensure case consistency
            if (monthMap.has(m)) {
                monthMap.set(m, (monthMap.get(m) || 0) + (l.amount || 0));
            }
        });

        const monthlyTrend = months.map(m => ({
            month: m,
            amount: monthMap.get(m) || 0
        }));

        // 6. All Categories (for filter)
        const allCategories = Array.from(categoryMap.keys()).sort();

        return {
            totalSpent,
            monthlyAverage,
            highestCategory,
            monthlyTrend,
            categoryDistribution,
            subCategoryBreakdown,
            allCategories,
            categoryBreakdown,
            categoryMonthlyTrend
        };
    }
}
