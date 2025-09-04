import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PlannerComponent } from './planner/planner.component';
import { LedgerComponent } from './ledger/ledger.component';
import { MonthlyPlannerComponent } from './planner/monthly-planner/monthly-planner.component';
import { AnnualPlannerComponent } from './planner/annual-planner/annual-planner.component';
import { ManagePlannerComponent } from './profile/manage-planner/manage-planner.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'monthly-planner', component: MonthlyPlannerComponent },
  { path: 'annual-planner', component: AnnualPlannerComponent },
  { path: 'manage-planner', component: ManagePlannerComponent },
  { path: 'ledger', component: LedgerComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
  exports: [RouterModule]
})
export class AppRoutingModule { }
