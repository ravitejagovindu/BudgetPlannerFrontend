import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../service/api.service';
import { PortfolioHolding } from '../model/portfolioHolding';
import { MutualFundHolding } from '../model/mutualFundHoldings';

@Component({
  selector: 'app-portfolio',
  standalone: false,
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent implements OnInit {
  loading: boolean = false;
  isConnected: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'success';
  username: string = '';
  connectionDate: Date = new Date();
  zerodhaAccessToken: string = '';
  portfolioHoldings: PortfolioHolding[] = [];
  showHoldings: boolean = false;
  mutualFundHoldings: MutualFundHolding[] = [];
  showMutualFunds: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    // Check if Zerodha connection already exists on backend
    this.checkZerodhaConnection();
  }

  connectToZerodha(): void {
    this.loading = true;
    this.closeAlert();

    // Call backend API to initiate Zerodha OAuth
    // Backend will handle redirect and session generation
    this.apiService.getZerodhaLoginUrl().subscribe({
      next: (response: any) => {
        this.loading = false;
        let data = response.data;
        if (data.loginUrl) {
          window.location.href = data.loginUrl;
        } else {
          this.showAlert(
            'Failed to initiate Zerodha connection. Please try again.',
            'error'
          );
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error initiating Zerodha connection:', error);
        this.showAlert(
          'Unable to connect to Zerodha. Please try again later.',
          'error'
        );
      },
    });
  }

  checkZerodhaConnection(): void {
    this.loading = true;

    // Call backend to check if user has an active Zerodha connection
    this.apiService.getZerodhaConnectionStatus().subscribe({
      next: (response: any) => {
        this.loading = false;
        let data = response.data;

        if (data.authenticated) {
          // User has active Zerodha connection
          this.isConnected = true;
          this.username = data.username || 'Zerodha User';
          this.connectionDate = response.connectionDate
            ? new Date(response.connectionDate)
            : new Date();
          this.zerodhaAccessToken = data.accessToken || '';

          this.showAlert('Zerodha account connected successfully!', 'success');
        } else {
          // No active connection
          this.isConnected = false;
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error checking Zerodha connection:', error);
        // If error, assume not connected
        this.isConnected = false;
      },
    });
  }

  viewHoldings(): void {
    if (!this.zerodhaAccessToken) {
      this.showAlert('Access token not available. Please reconnect.', 'error');
      return;
    }

    this.loading = true;

    // Call backend API to fetch portfolio data
    // Backend will use the stored access_token
    this.apiService.getHodlings().subscribe({
      next: (response: any) => {
        this.loading = false;
        let data = response.data;
        console.log('Portfolio Holding data:', data);
        this.portfolioHoldings = [];
        this.portfolioHoldings = data;
        this.showHoldings = true;

        // TODO: Display portfolio data in UI
        this.showAlert('Portfolio data loaded successfully!', 'success');
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error fetching portfolio:', error);
        this.showAlert('Failed to load portfolio data.', 'error');
      },
    });
  }

  getTotalInvestment(): number {
    return this.portfolioHoldings.reduce((total, holding) => {
      return total + holding.averagePrice * holding.quantity;
    }, 0);
  }

  // Helper method to get current portfolio value
  getCurrentValue(): number {
    return this.portfolioHoldings.reduce((total, holding) => {
      return total + holding.lastPrice * holding.quantity;
    }, 0);
  }

  // Helper method to get total P&L
  getTotalPnL(): number {
    return this.portfolioHoldings.reduce((total, holding) => {
      return total + holding.pnl;
    }, 0);
  }

  // Helper method to get total day change
  getTotalDayChange(): number {
    return this.portfolioHoldings.reduce((total, holding) => {
      return total + holding.dayChange;
    }, 0);
  }

  // Helper method to calculate overall P&L percentage
  getPnLPercentage(): number {
    const totalInvestment = this.getTotalInvestment();
    if (totalInvestment === 0) return 0;
    return (this.getTotalPnL() / totalInvestment) * 100;
  }

  // Helper method to determine if overall P&L is positive
  isOverallProfitable(): boolean {
    return this.getTotalPnL() >= 0;
  }

  // Helper method to check if individual holding is profitable
  isProfitable(holding: PortfolioHolding): boolean {
    return holding.pnl >= 0;
  }

  // Helper method to check if day change is positive
  isDayChangePositive(holding: PortfolioHolding): boolean {
    return holding.dayChange >= 0;
  }

  viewMutualFunds(): void {
    if (!this.zerodhaAccessToken) {
      this.showAlert('Access token not available. Please reconnect.', 'error');
      return;
    }

    this.loading = true;

    // Call backend API to fetch mutual funds data
    this.apiService.getMutualFunds().subscribe({
      next: (response: any) => {
        this.loading = false;
        let data = response.data;
        console.log('Mutual Fund Holding data:', data);
        this.mutualFundHoldings = [];
        this.mutualFundHoldings = data;
        this.showMutualFunds = true;
        // Hide holdings when showing mutual funds
        this.showHoldings = false;

        // Display mutual funds data in UI
        this.showAlert('Mutual Funds data loaded successfully!', 'success');
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error fetching mutual funds:', error);
        this.showAlert('Failed to load mutual funds data.', 'error');
      },
    });
  }

  getMFTotalInvestment(): number {
    return this.mutualFundHoldings.reduce((total, holding) => {
      return total + holding.averagePrice * holding.quantity;
    }, 0);
  }

  getMFCurrentValue(): number {
    return this.mutualFundHoldings.reduce((total, holding) => {
      return total + holding.lastPrice * holding.quantity;
    }, 0);
  }

  getMFTotalPnL(): number {
    return this.mutualFundHoldings.reduce((total, holding) => {
      return total + holding.pnl;
    }, 0);
  }

  getMFPnLPercentage(): number {
    const totalInvestment = this.getMFTotalInvestment();
    if (totalInvestment === 0) return 0;
    return (this.getMFTotalPnL() / totalInvestment) * 100;
  }

  isMFOverallProfitable(): boolean {
    return this.getMFTotalPnL() >= 0;
  }

  isMFProfitable(holding: MutualFundHolding): boolean {
    return holding.pnl >= 0;
  }

  showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.closeAlert();
    }, 5000);
  }

  closeAlert(): void {
    this.alertMessage = '';
  }

  disconnect(): void {
    if (confirm('Are you sure you want to disconnect your Zerodha account?')) {
      this.loading = true;

      // Call backend to invalidate Zerodha session
      this.apiService.disconnectZerodha().subscribe({
        next: (response: any) => {
          this.loading = false;
          this.isConnected = false;
          this.zerodhaAccessToken = '';
          this.portfolioHoldings = [];
          this.showHoldings = false;
          this.mutualFundHoldings = [];
          this.showMutualFunds = false;
          this.showAlert(
            'Zerodha account disconnected successfully.',
            'success'
          );
        },
        error: (error: any) => {
          this.loading = false;
          console.error('Error disconnecting Zerodha:', error);
          this.showAlert('Failed to disconnect. Please try again.', 'error');
        },
      });
    }
  }
}
