import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PlannerComponent } from './planner/planner.component';
import { LedgerComponent } from './ledger/ledger.component';
import { MonthlyPlannerComponent } from './planner/monthly-planner/monthly-planner.component';
import { AnnualPlannerComponent } from './planner/annual-planner/annual-planner.component';
import { ManagePlannerComponent } from './profile/manage-planner/manage-planner.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './gaurd/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'monthly-planner',
    component: MonthlyPlannerComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'annual-planner',
    component: AnnualPlannerComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'manage-planner',
    component: ManagePlannerComponent,
    canActivate: [AuthGuard],
  },
  { path: 'ledger', component: LedgerComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
