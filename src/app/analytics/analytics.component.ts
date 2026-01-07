import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import { AnalyticsService } from './analytics.service';

@Component({
    selector: 'app-analytics',
    templateUrl: './analytics.component.html',
    styleUrls: ['./analytics.component.css'],
    standalone: false
})
export class AnalyticsComponent implements OnInit {
    Highcharts: typeof Highcharts = Highcharts;

    // Charts
    trendChartOptions: Highcharts.Options = {};
    categoryPieChartOptions: Highcharts.Options = {};
    subCategoryBarChartOptions: Highcharts.Options = {};

    // Metrics
    totalSpent: number = 0;
    monthlyAverage: number = 0;
    highestCategory: { name: string, amount: number } = { name: '-', amount: 0 };

    // Filters
    years: number[] = [];
    // selectedYear: number = new Date().getFullYear();
    selectedYear: number = 2025;
    categories: string[] = [];
    selectedCategories: string[] = [];

    isLoading: boolean = false;

    constructor(private analyticsService: AnalyticsService) { }

    ngOnInit(): void {
        this.isLoading = true;
        // Initial data load will be implemented here
        this.analyticsService.getAvailableYears().subscribe((years: number[]) => {
            this.years = years.sort((a: number, b: number) => b - a);
            if (this.years.length > 0) {
                this.selectedYear = this.years[0];
                this.loadData();
            } else {
                this.loadData();
            }
        });
    }

    currentAnalyticsData: any; // Store data for local drill-down
    selectedDrilldownCategory: string | null = null;

    loadData(): void {
        this.isLoading = true;
        this.totalSpent = 0;
        this.monthlyAverage = 0;
        this.highestCategory = { name: '-', amount: 0 };
        this.selectedDrilldownCategory = null; // Reset drill-down on reload
        console.log('Loading data for year:', this.selectedYear, 'Categories:', this.selectedCategories);
        this.analyticsService.getAnalyticsData(this.selectedYear, this.selectedCategories).subscribe((data: any) => {
            console.log('Analytics Data Received:', data);
            this.currentAnalyticsData = data;
            this.totalSpent = data.totalSpent;
            this.monthlyAverage = data.monthlyAverage;
            this.highestCategory = data.highestCategory;

            // Only update categories list if we are NOT filtering, 
            // otherwise the filter list shrinks to what's selected, which is bad UX.
            if (this.selectedCategories.length === 0) {
                this.categories = data.allCategories;
            }

            this.updateCharts(data);
            this.isLoading = false;
        }, error => {
            console.error('Error loading analytics data:', error);
            this.isLoading = false;
        });
    }

    onYearChange(): void {
        this.loadData();
    }

    toggleCategory(category: string): void {
        // ... existing implementation ...
        if (category === '') {
            // "All Categories" selected
            this.selectedCategories = [];
        } else {
            const index = this.selectedCategories.indexOf(category);
            if (index > -1) {
                this.selectedCategories.splice(index, 1);
            } else {
                this.selectedCategories.push(category);
            }
        }
        this.loadData();
    }

    onPieSliceClick(categoryName: string): void {
        // Toggle selection
        if (this.selectedDrilldownCategory === categoryName) {
            this.selectedDrilldownCategory = null; // Deselect
        } else {
            this.selectedDrilldownCategory = categoryName;
        }
        this.updateDrilldownCharts();
    }

    updateDrilldownCharts(): void {
        const data = this.currentAnalyticsData;
        if (!data) return;

        // --- 0. Update Summary Cards based on Selection ---
        if (this.selectedDrilldownCategory && data.categoryBreakdown && data.categoryBreakdown[this.selectedDrilldownCategory]) {
            // Calculate Total Spent for selected category
            const categorySubItems: { name: string, y: number }[] = data.categoryBreakdown[this.selectedDrilldownCategory];
            const categoryTotal = categorySubItems.reduce((sum: number, item: { y: number }) => sum + item.y, 0);
            this.totalSpent = categoryTotal;

            // Calculate Monthly Average for selected category
            const categoryTrend = data.categoryMonthlyTrend && data.categoryMonthlyTrend[this.selectedDrilldownCategory];
            if (categoryTrend && categoryTrend.length > 0) {
                const monthsWithData = categoryTrend.filter((m: { amount: number }) => m.amount > 0).length;
                this.monthlyAverage = monthsWithData > 0 ? categoryTotal / monthsWithData : 0;
            } else {
                this.monthlyAverage = 0;
            }

            // Find Highest Sub-Category within selected category
            if (categorySubItems.length > 0) {
                const sorted = [...categorySubItems].sort((a, b) => b.y - a.y);
                this.highestCategory = { name: sorted[0].name, amount: sorted[0].y };
            } else {
                this.highestCategory = { name: '-', amount: 0 };
            }
        } else {
            // Reset to global values
            this.totalSpent = data.totalSpent;
            this.monthlyAverage = data.monthlyAverage;
            this.highestCategory = data.highestCategory;
        }

        // --- 1. Update Bar Chart (Sub-Category) ---
        let barData = [];
        let barTitle = '';

        if (this.selectedDrilldownCategory && data.categoryBreakdown && data.categoryBreakdown[this.selectedDrilldownCategory]) {
            // Show breakdown for specific category
            barData = data.categoryBreakdown[this.selectedDrilldownCategory];
            barTitle = `Top Expenses in ${this.selectedDrilldownCategory}`;
        } else {
            // Show global top 10 sub-categories
            barData = data.subCategoryBreakdown;
            barTitle = 'Top Expense Sub-Categories';
        }

        this.subCategoryBarChartOptions = {
            chart: {
                type: 'bar',
                backgroundColor: 'transparent',
                style: { fontFamily: 'Inter, sans-serif' }
            },
            title: {
                text: barTitle,
                align: 'left',
                style: { fontSize: '14px', color: '#64748b' }
            },
            xAxis: {
                categories: barData.map((d: any) => d.name),
                labels: { style: { color: '#64748b' } },
                lineWidth: 0
            },
            yAxis: {
                min: 0,
                title: { text: '' },
                gridLineColor: '#f1f5f9'
            },
            legend: { enabled: false },
            plotOptions: {
                bar: {
                    borderRadius: 4
                }
            },
            tooltip: {
                valuePrefix: '₹'
            },
            series: [{
                name: 'Spent',
                type: 'bar',
                data: barData.map((d: any) => d.y),
                color: '#3b82f6'
            }]
        };

        // --- 2. Update Trend Chart ---
        let trendData = [];
        let trendTitle = '';

        if (this.selectedDrilldownCategory && data.categoryMonthlyTrend && data.categoryMonthlyTrend[this.selectedDrilldownCategory]) {
            // Specific Category Trend
            trendData = data.categoryMonthlyTrend[this.selectedDrilldownCategory];
            trendTitle = `Monthly Trend for ${this.selectedDrilldownCategory}`;
        } else {
            // Global Trend
            trendData = data.monthlyTrend;
            trendTitle = 'Monthly Expense Trend'; // Reset title or keep generic
        }

        this.trendChartOptions = {
            chart: {
                type: 'spline',
                backgroundColor: 'transparent',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
            title: { text: '' }, // Keep title empty or use trendTitle if you add a header to the chart config
            // Note: HTML might have hardcoded title? No, we removed it. 
            // Let's add the title inside Highcharts for clarity now, or update a property bound in HTML?
            // User asked for the chart to change. Visual feedback is key.
            // Let's set the title in Highcharts configuration.
            subtitle: {
                text: trendTitle,
                align: 'left',
                style: { color: '#64748b' }
            },
            xAxis: {
                categories: trendData.map((d: any) => d.month.substring(0, 3)),
                labels: { style: { color: '#64748b' } },
                lineColor: '#e2e8f0'
            },
            yAxis: {
                title: { text: '' },
                labels: { style: { color: '#64748b' } },
                gridLineColor: '#f1f5f9'
            },
            tooltip: {
                shared: true,
                valuePrefix: '₹',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                borderWidth: 0,
                shadow: true,
                style: { color: '#333' }
            },
            series: [{
                name: 'Expenses',
                data: trendData.map((d: any) => d.amount),
                color: '#2563eb', // var(--primary)
                type: 'spline',
                marker: {
                    fillColor: '#ffffff',
                    lineWidth: 2,
                    lineColor: '#2563eb'
                }
            }]
        };
    }

    updateCharts(data: any): void {
        const self = this; // Capture reference for Highcharts event

        // Initialize Drilldown Charts (Bar + Trend)
        this.updateDrilldownCharts();

        // 2. Category Pie Chart - ALWAYS show High Level categories unless Filtered globally
        // If Global Filter has 1 category -> Pie shows 1 slice? Or we show SubCats? 
        // User liked "Seeing all categories". So always Key Metrics -> Pie (Categories).

        this.categoryPieChartOptions = {
            chart: {
                type: 'pie',
                backgroundColor: 'transparent',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
            title: {
                text: 'Category Distribution',
                style: { fontSize: '14px', color: '#64748b' }
            },
            tooltip: {
                pointFormat: '{series.name}: <b>₹{point.y:.2f}</b><br/><b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true,
                    borderWidth: 0,
                    innerSize: '60%', // Donut style
                    events: {
                        click: function (event: any) {
                            const categoryName = event.point.name;
                            // Non-destructive update
                            // Use setTimeout to run inside Angular zone check if needed, 
                            // but usually logic runs fine if we just call the method.
                            self.onPieSliceClick(categoryName);
                        }
                    }
                }
            },
            legend: {
                itemStyle: { color: '#64748b', fontWeight: '500' },
                itemHoverStyle: { color: '#1e293b' }
            },
            series: [{
                type: 'pie',
                name: 'Amount',
                // @ts-ignore
                colorByPoint: true,
                data: data.categoryDistribution
            }]
        };
    }
}
