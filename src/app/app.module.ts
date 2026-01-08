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
import { LoginComponent } from './login/login.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { JwtInterceptor } from './interceptor/jwt.interceptor';
import { HttpErrorInterceptor } from './interceptor/http-error.interceptor';
import { MonthPickerComponent } from './shared/components/month-picker/month-picker.component';
import { BankPortfolioComponent } from './portfolio/bank-portfolio/bank-portfolio.component';
import { DematPortfolioComponent } from './portfolio/demat-portfolio/demat-portfolio.component';
import { FinancialDashboardComponent } from './dashboard/financial-dashboard/financial-dashboard.component';
import { AnalyticsModule } from './analytics/analytics.module';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DashboardComponent,
    LedgerComponent,
    PlannerComponent,
    LoginComponent,
    PortfolioComponent,
    MonthPickerComponent,
    BankPortfolioComponent,
    DematPortfolioComponent,
    FinancialDashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    HighchartsChartModule,
    AnalyticsModule
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
