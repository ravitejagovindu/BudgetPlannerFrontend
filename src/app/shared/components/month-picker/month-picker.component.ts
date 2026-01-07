import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-month-picker',
    standalone: false,
    templateUrl: './month-picker.component.html',
    styleUrls: ['./month-picker.component.css']
})
export class MonthPickerComponent implements OnInit {
    @Input() currentMonthYear: string = '';
    @Output() monthSelect = new EventEmitter<string>();

    isDtPickerOpen: boolean = false;
    dtPickerYear: number = new Date().getFullYear();
    monthsList: string[] = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    constructor(private eRef: ElementRef) { }

    ngOnInit(): void {
        if (!this.currentMonthYear) {
            const now = new Date();
            this.currentMonthYear = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        }
        this.dtPickerYear = parseInt(this.currentMonthYear.split('-')[0]);
    }

    get formattedMonth(): string {
        if (!this.currentMonthYear) return '';
        const [year, month] = this.currentMonthYear.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    get currentViewYear(): number {
        return this.currentMonthYear ? parseInt(this.currentMonthYear.split('-')[0]) : 0;
    }

    get currentViewMonth(): number {
        return this.currentMonthYear ? parseInt(this.currentMonthYear.split('-')[1]) : 0;
    }

    toggleDtPicker(): void {
        this.isDtPickerOpen = !this.isDtPickerOpen;
        if (this.isDtPickerOpen) {
            this.dtPickerYear = parseInt(this.currentMonthYear.split('-')[0]);
        }
    }

    changeDtPickerYear(delta: number): void {
        this.dtPickerYear += delta;
    }

    selectDtPickerMonth(monthIndex: number): void {
        const year = this.dtPickerYear;
        const month = monthIndex + 1;
        this.currentMonthYear = `${year}-${month < 10 ? '0' : ''}${month}`;
        this.isDtPickerOpen = false;
        this.monthSelect.emit(this.currentMonthYear);
    }

    prevMonth(): void {
        const [year, month] = this.currentMonthYear.split('-').map(Number);
        const date = new Date(year, month - 2, 1);
        this.updateMonth(date);
    }

    nextMonth(): void {
        const [year, month] = this.currentMonthYear.split('-').map(Number);
        const date = new Date(year, month, 1);
        this.updateMonth(date);
    }

    private updateMonth(date: Date): void {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        this.currentMonthYear = `${y}-${m < 10 ? '0' : ''}${m}`;
        this.monthSelect.emit(this.currentMonthYear);
    }

    @HostListener('document:click', ['$event'])
    clickout(event: any) {
        if (this.isDtPickerOpen) {
            if (!this.eRef.nativeElement.contains(event.target)) {
                this.isDtPickerOpen = false;
            }
        }
    }
}
