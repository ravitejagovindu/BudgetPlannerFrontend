import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LedgerComponent } from './ledger/ledger.component';
import { PlannerComponent } from './planner/planner.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HighchartsChartModule } from 'highcharts-angular';
import { MonthlyPlannerComponent } from './planner/monthly-planner/monthly-planner.component';
import { AnnualPlannerComponent } from './planner/annual-planner/annual-planner.component';
import { ManagePlannerComponent } from './profile/manage-planner/manage-planner.component';
import { LoginComponent } from './login/login.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { JwtInterceptor } from './interceptor/jwt.interceptor';
import { HttpErrorInterceptor } from './interceptor/http-error.interceptor';
import { MonthPickerComponent } from './shared/components/month-picker/month-picker.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DashboardComponent,
    LedgerComponent,
    PlannerComponent,
    MonthlyPlannerComponent,
    AnnualPlannerComponent,
    ManagePlannerComponent,
    LoginComponent,
    PortfolioComponent,
    MonthPickerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    HighchartsChartModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
