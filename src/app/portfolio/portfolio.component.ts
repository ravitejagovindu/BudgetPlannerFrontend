import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-portfolio',
  standalone: false,
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent implements OnInit {
  activeTab: 'bank' | 'demat' = 'bank';

  constructor() { }

  ngOnInit(): void {
  }

  setActiveTab(tab: 'bank' | 'demat') {
    this.activeTab = tab;
  }
}
