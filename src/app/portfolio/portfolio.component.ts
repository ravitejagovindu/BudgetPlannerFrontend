import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../service/api.service';
import { AuthService } from '../service/auth.service';
import { PortfolioHolding } from '../model/portfolioHolding';
import { MutualFundHolding } from '../model/mutualFundHoldings';
import { HttpHeaders } from '@angular/common/http';

// Interface for Zerodha broker status from backend
interface BrokerStatus {
  clientId: string;
  username: string;
  authenticated: boolean;
}

// Interface for account state (one per client-id)
interface AccountState {
  broker: BrokerStatus;
  portfolioHoldings: PortfolioHolding[];
  showHoldings: boolean;
  mutualFundHoldings: MutualFundHolding[];
  showMutualFunds: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-portfolio',
  standalone: false,
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent implements OnInit {
  // Global state
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'success';
  globalLoading: boolean = false;
  isConnected: boolean = false;

  // NEW: Array of broker accounts - one section per account
  brokerAccounts: AccountState[] = [];

  showOnboardingForm: boolean = false;
  onboardingClientId: string = '';
  onboardingLoading: boolean = false;
  onboardingSuccess: boolean = false;
  onboardingMessage: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Check for OAuth callback parameters
    this.route.queryParams.subscribe((params) => {
      if (params['status'] === 'success' && params['client-id']) {
        console.log(
          'OAuth callback received with client-id:',
          params['client-id']
        );
        // Clean URL
        this.router.navigate(['/portfolio']);
        // Check connection to get all broker accounts
        this.checkZerodhaConnection();
      } else {
        // No OAuth callback, check existing connections
        this.checkZerodhaConnection();
      }
    });
  }

  checkZerodhaConnection(): void {
    this.globalLoading = true;

    // Get status - backend now returns array of BrokerStatusResponse[]
    this.apiService.getZerodhaConnectionStatus().subscribe({
      next: (response: any) => {
        this.globalLoading = false;
        this.isConnected = true;
        // Response should contain array of broker accounts
        const brokerStatuses: BrokerStatus[] = response.data || [];

        if (brokerStatuses && brokerStatuses.length > 0) {
          console.log('Broker accounts received:', brokerStatuses);

          // Initialize account states for each broker
          this.brokerAccounts = brokerStatuses.map((broker) => ({
            broker,
            portfolioHoldings: [],
            showHoldings: false,
            mutualFundHoldings: [],
            showMutualFunds: false,
            loading: false,
          }));

          this.showAlert(
            `Successfully loaded ${brokerStatuses.length} Zerodha account(s)!`,
            'success'
          );
        } else {
          this.brokerAccounts = [];
          console.log('No broker accounts found');
        }
      },
      error: (error: any) => {
        this.globalLoading = false;
        console.error('Error checking Zerodha connection:', error);
        this.brokerAccounts = [];
      },
    });
  }

  /**
   * Connect to Zerodha - initiates OAuth flow
   * @param clientId - specific client-id to connect (optional)
   */
  connectToZerodha(accountState: AccountState): void {
    this.globalLoading = true;
    this.closeAlert();

    this.apiService
      .getZerodhaLoginUrl(
        this.buildPortfolioHeaders(accountState.broker.clientId)
      )
      .subscribe({
        next: (response: any) => {
          this.globalLoading = false;
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
          this.globalLoading = false;
          console.error('Error initiating Zerodha connection:', error);
          this.showAlert(
            'Unable to connect to Zerodha. Please try again later.',
            'error'
          );
        },
      });
  }

  // NEW: Toggle onboarding form
  toggleOnboardingForm(): void {
    this.showOnboardingForm = !this.showOnboardingForm;
    this.onboardingClientId = '';
    this.onboardingSuccess = false;
    this.onboardingMessage = '';
  }

  // NEW: Onboard new Zerodha account using Client ID
  onboardZerodhaAccount(): void {
    // Validate Client ID
    if (!this.onboardingClientId || this.onboardingClientId.trim() === '') {
      this.showOnboardingAlert('Please enter a valid Client ID.', 'error');
      return;
    }

    // Check if Client ID is valid format (basic validation)
    if (this.onboardingClientId.trim().length != 6) {
      this.showOnboardingAlert('Client ID is invalid.', 'error');
      return;
    }

    this.onboardingLoading = true;

    // Call backend API to onboard account
    this.apiService
      .onboardZerodhaAccount(
        this.onboardingClientId.trim(),
        this.buildPortfolioHeaders(this.onboardingClientId.trim())
      )
      .subscribe({
        next: (response: any) => {
          this.onboardingLoading = false;
          this.onboardingSuccess = true;
          this.onboardingMessage = 'Account creation Successful!';
          this.showOnboardingAlert(this.onboardingMessage, 'info');

          // Reset form after success
          setTimeout(() => {
            this.resetOnboardingForm();
            // Refresh connection status after a few seconds
            setTimeout(() => {
              this.checkZerodhaConnection();
            }, 3000);
          }, 3000);
          this.checkZerodhaConnection();
        },
        error: (error: any) => {
          this.onboardingLoading = false;
          console.error('Error onboarding Zerodha account:', error);

          // User-friendly error messages
          let errorMessage = 'Failed to create account. Please try again.';

          if (error.status === 400) {
            errorMessage =
              'Invalid Client ID format. Please check and try again.';
          } else if (error.status === 409) {
            errorMessage = 'This account is already linked.';
          } else if (error.status === 401 || error.status === 403) {
            errorMessage = 'Unauthorized. Please check your credentials.';
          } else if (error.status === 500) {
            errorMessage = 'Server error occurred. Please try again later.';
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }

          this.showOnboardingAlert(errorMessage, 'error');
        },
      });
  }

  // NEW: Show onboarding alert
  showOnboardingAlert(
    message: string,
    type: 'success' | 'error' | 'info'
  ): void {
    // This can be used for inline notifications or toastr if integrated
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // NEW: Reset onboarding form
  resetOnboardingForm(): void {
    this.onboardingClientId = '';
    this.onboardingSuccess = false;
    this.onboardingMessage = '';
    this.showOnboardingForm = false;
  }

  /**
   * View holdings for specific client-id
   * @param accountState - account state containing client-id
   */
  viewHoldings(accountState: AccountState): void {
    if (!accountState.broker.authenticated) {
      this.showAlert('Please connect to Zerodha first.', 'error');
      return;
    }

    accountState.loading = true;

    // Pass client-id to API
    this.apiService
      .getHodlings(this.buildPortfolioHeaders(accountState.broker.clientId))
      .subscribe({
        next: (response: any) => {
          accountState.loading = false;
          let data = response.data;
          console.log(
            'Portfolio Holding data for',
            accountState.broker.clientId,
            ':',
            data
          );

          accountState.portfolioHoldings = data || [];
          accountState.showHoldings = true;
          accountState.showMutualFunds = false;

          this.showAlert('Portfolio data loaded successfully!', 'success');
        },
        error: (error: any) => {
          accountState.loading = false;
          console.error('Error fetching portfolio:', error);
          this.showAlert('Failed to load portfolio data.', 'error');
        },
      });
  }

  /**
   * View mutual funds for specific client-id
   * @param accountState - account state containing client-id
   */
  viewMutualFunds(accountState: AccountState): void {
    if (!accountState.broker.authenticated) {
      this.showAlert('Please connect to Zerodha first.', 'error');
      return;
    }

    accountState.loading = true;

    // Pass client-id to API
    this.apiService
      .getMutualFunds(this.buildPortfolioHeaders(accountState.broker.clientId))
      .subscribe({
        next: (response: any) => {
          accountState.loading = false;
          let data = response.data;
          console.log(
            'Mutual Fund Holding data for',
            accountState.broker.clientId,
            ':',
            data
          );

          accountState.mutualFundHoldings = data || [];
          accountState.showMutualFunds = true;
          accountState.showHoldings = false;

          this.showAlert('Mutual Funds data loaded successfully!', 'success');
        },
        error: (error: any) => {
          accountState.loading = false;
          console.error('Error fetching mutual funds:', error);
          this.showAlert('Failed to load mutual funds data.', 'error');
        },
      });
  }

  /**
   * Disconnect from Zerodha for specific client-id
   * @param accountState - account state containing client-id
   */
  // NEW state for disconnect modal
  showDisconnectModal: boolean = false;
  accountToDisconnect: AccountState | null = null;
  disconnecting: boolean = false;

  /**
   * Initiate disconnect flow - opens modal
   * @param accountState
   */
  initiateDisconnect(accountState: AccountState): void {
    this.accountToDisconnect = accountState;
    this.showDisconnectModal = true;
  }

  /**
   * Cancel disconnect
   */
  cancelDisconnect(): void {
    this.showDisconnectModal = false;
    this.accountToDisconnect = null;
  }

  /**
   * Confirm and proceed with disconnect
   */
  confirmDisconnect(): void {
    if (!this.accountToDisconnect) return;

    const accountState = this.accountToDisconnect;
    this.disconnecting = true; // Local loading for modal if needed, or use accountState.loading

    // Use accountState.loading to show spinner on the button if still visible, 
    // or just use disconnectingstate for the modal button
    this.dataDisconnect(accountState);
  }

  private dataDisconnect(accountState: AccountState): void {
    // Pass client-id to API for disconnect
    this.apiService
      .disconnectZerodha(
        this.buildPortfolioHeaders(accountState.broker.clientId)
      )
      .subscribe({
        next: (response: any) => {
          this.disconnecting = false;
          this.showDisconnectModal = false;
          this.accountToDisconnect = null;

          // Remove this account from the list
          const index = this.brokerAccounts.indexOf(accountState);
          if (index > -1) {
            this.brokerAccounts.splice(index, 1);
          }

          this.showAlert(
            `Zerodha account (${accountState.broker.username}) disconnected successfully.`,
            'success'
          );
        },
        error: (error: any) => {
          this.disconnecting = false;
          this.showDisconnectModal = false; // Close modal on error? Or keep open? calling close for now.
          console.error('Error disconnecting Zerodha:', error);
          this.showAlert('Failed to disconnect. Please try again.', 'error');
        },
      });
  }

  // ========================================
  // PORTFOLIO CALCULATIONS (per account)
  // ========================================

  getTotalInvestment(holdings: PortfolioHolding[]): number {
    return holdings.reduce((total, holding) => {
      return total + holding.averagePrice * holding.quantity;
    }, 0);
  }

  getCurrentValue(holdings: PortfolioHolding[]): number {
    return holdings.reduce((total, holding) => {
      return total + holding.lastPrice * holding.quantity;
    }, 0);
  }

  getTotalPnL(holdings: PortfolioHolding[]): number {
    return holdings.reduce((total, holding) => {
      return total + holding.pnl;
    }, 0);
  }

  getTotalDayChange(holdings: PortfolioHolding[]): number {
    return holdings.reduce((total, holding) => {
      return total + holding.dayChange;
    }, 0);
  }

  getPnLPercentage(holdings: PortfolioHolding[]): number {
    const totalInvestment = this.getTotalInvestment(holdings);
    if (totalInvestment === 0) return 0;
    return (this.getTotalPnL(holdings) / totalInvestment) * 100;
  }

  isOverallProfitable(holdings: PortfolioHolding[]): boolean {
    return this.getTotalPnL(holdings) >= 0;
  }

  isProfitable(holding: PortfolioHolding): boolean {
    return holding.pnl >= 0;
  }

  isDayChangePositive(holding: PortfolioHolding): boolean {
    return holding.dayChange >= 0;
  }

  // ========================================
  // MUTUAL FUND CALCULATIONS (per account)
  // ========================================

  getMFTotalInvestment(holdings: MutualFundHolding[]): number {
    return holdings.reduce((total, holding) => {
      return total + holding.averagePrice * holding.quantity;
    }, 0);
  }

  getMFCurrentValue(holdings: MutualFundHolding[]): number {
    return holdings.reduce((total, holding) => {
      return total + holding.lastPrice * holding.quantity;
    }, 0);
  }

  getMFTotalPnL(holdings: MutualFundHolding[]): number {
    return holdings.reduce((total, holding) => {
      return total + holding.pnl;
    }, 0);
  }

  getMFPnLPercentage(holdings: MutualFundHolding[]): number {
    const totalInvestment = this.getMFTotalInvestment(holdings);
    if (totalInvestment === 0) return 0;
    return (this.getMFTotalPnL(holdings) / totalInvestment) * 100;
  }

  isMFOverallProfitable(holdings: MutualFundHolding[]): boolean {
    return this.getMFTotalPnL(holdings) >= 0;
  }

  isMFProfitable(holding: MutualFundHolding): boolean {
    return holding.pnl >= 0;
  }

  // ========================================
  // ALERT METHODS
  // ========================================

  showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;

    setTimeout(() => {
      this.closeAlert();
    }, 5000);
  }

  closeAlert(): void {
    this.alertMessage = '';
  }

  private buildPortfolioHeaders(clientId: string): HttpHeaders {
    let headers = new HttpHeaders();
    if (clientId && clientId.trim() !== '') {
      headers = headers.set('Client-ID', clientId);
      console.log('✓ Client-ID header added:', clientId);
    } else {
      console.log('✗ Client-ID header NOT added - clientId empty');
    }
    return headers;
  }
}
