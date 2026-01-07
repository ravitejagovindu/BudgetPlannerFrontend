import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  activeTab: 'financial' | 'analytics' = 'financial';

  setActiveTab(tab: 'financial' | 'analytics') {
    this.activeTab = tab;
  }
}
