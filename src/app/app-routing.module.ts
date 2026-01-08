import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PlannerComponent } from './planner/planner.component';
import { LedgerComponent } from './ledger/ledger.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './gaurd/auth.guard';
import { PortfolioComponent } from './portfolio/portfolio.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'planner',
    component: PlannerComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'monthly-planner',
    redirectTo: 'planner',
    pathMatch: 'full'
  },
  {
    path: 'manage-planner',
    redirectTo: 'planner',
    pathMatch: 'full'
  },
  { path: 'ledger', component: LedgerComponent, canActivate: [AuthGuard] },
  {
    path: 'portfolio',
    component: PortfolioComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'analytics',
    loadChildren: () => import('./analytics/analytics.module').then(m => m.AnalyticsModule),
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
