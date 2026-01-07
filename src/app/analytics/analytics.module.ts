import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HighchartsChartModule } from 'highcharts-angular';
import { AnalyticsComponent } from './analytics.component';
import { AnalyticsService } from './analytics.service';

const routes: Routes = [
    { path: '', component: AnalyticsComponent }
];

@NgModule({
    declarations: [
        AnalyticsComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        FormsModule,
        ReactiveFormsModule,
        HighchartsChartModule
    ],
    providers: [
        AnalyticsService
    ]
})
export class AnalyticsModule { }
