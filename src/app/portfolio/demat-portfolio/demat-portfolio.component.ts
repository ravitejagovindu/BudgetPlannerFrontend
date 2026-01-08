import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../../service/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { PortfolioHolding } from '../../model/portfolioHolding';
import { MutualFundHolding } from '../../model/mutualFundHoldings';
import { Portfolio } from '../../model/portfolio';
import { ApiResponse } from '../../service/api.service';

// Interface for Zerodha broker status from backend
export interface BrokerStatus {
    clientId: string;
    username: string;
    authenticated: boolean;
}

// Interface for account state (one per client-id)
export interface AccountState {
    broker: BrokerStatus;
    portfolioHoldings: PortfolioHolding[];
    showHoldings: boolean;
    mutualFundHoldings: MutualFundHolding[];
    showMutualFunds: boolean;
    loading: boolean;
}

@Component({
    selector: 'app-demat-portfolio',
    standalone: false,
    templateUrl: './demat-portfolio.component.html',
    styleUrls: ['./demat-portfolio.component.css']
})
export class DematPortfolioComponent implements OnInit, OnChanges {
    @Input() allPortfolios: Portfolio[] = [];
    @Output() edit = new EventEmitter<Portfolio>();
    @Output() delete = new EventEmitter<Portfolio>();
    // Global state
    alertMessage: string = '';
    alertType: 'success' | 'error' = 'success';
    globalLoading: boolean = false;
    isConnected: boolean = false;
    activeTab: 'zerodha' | 'other' = 'zerodha';

    // Zerodha Accounts
    brokerAccounts: AccountState[] = [];

    showOnboardingForm: boolean = false;
    onboardingClientId: string = '';
    onboardingLoading: boolean = false;
    onboardingSuccess: boolean = false;
    onboardingMessage: string = '';

    // Disconnect Modal State
    showDisconnectModal: boolean = false;
    accountToDisconnect: AccountState | null = null;
    disconnecting: boolean = false;

    loadingOtherAssets: boolean = false;
    otherMutualFunds: any[] = [];
    npsDetails: any = null;
    ppfDetails: any = null;

    // Internal lists for CRUD support
    npsAccountsList: Portfolio[] = [];
    ppfAccountsList: Portfolio[] = [];
    mfAccountsList: Portfolio[] = [];

    constructor(
        private apiService: ApiService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Check for OAuth callback parameters
        this.route.queryParams.subscribe((params) => {
            if (params['status'] === 'success' && params['client-id']) {
                console.log('OAuth callback received with client-id:', params['client-id']);
                // Clean URL
                this.router.navigate(['/portfolio']);
                // Check connection to get all broker accounts
                this.checkZerodhaConnection();
            } else {
                // No OAuth callback, check existing connections
                this.checkZerodhaConnection();
            }
        });

        this.loadOtherAssets();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['allPortfolios']) {
            this.loadOtherAssets();
        }
    }

    setActiveTab(tab: 'zerodha' | 'other') {
        this.activeTab = tab;
    }

    loadOtherAssets() {
        if (this.allPortfolios && this.allPortfolios.length > 0) {
            const portfolios = this.allPortfolios;

            // Filter Other Mutual Funds (Case-insensitive)
            this.mfAccountsList = portfolios.filter(p =>
                p.type.toUpperCase() === 'MUTUAL FUND' || p.type.toUpperCase() === 'MF');
            this.otherMutualFunds = this.mfAccountsList.map(p => ({
                id: p.id,
                fundName: p.name,
                nav: 'N/A',
                currentValue: p.balance,
                portfolioObj: p
            }));

            // Filter NPS (Case-insensitive)
            this.npsAccountsList = portfolios.filter(p => p.type.toUpperCase() === 'NPS');

            // Filter PPF (Case-insensitive)
            this.ppfAccountsList = portfolios.filter(p => p.type.toUpperCase() === 'PPF');
        } else {
            this.mfAccountsList = [];
            this.otherMutualFunds = [];
            this.npsAccountsList = [];
            this.ppfAccountsList = [];
        }
        this.loadingOtherAssets = false;
    }

    onEdit(portfolio: Portfolio) {
        this.edit.emit(portfolio);
    }

    onDelete(portfolio: Portfolio) {
        this.delete.emit(portfolio);
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
     * @param accountState
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

    // Toggle onboarding form
    toggleOnboardingForm(): void {
        this.showOnboardingForm = !this.showOnboardingForm;
        this.onboardingClientId = '';
        this.onboardingSuccess = false;
        this.onboardingMessage = '';
    }

    // Onboard new Zerodha account using Client ID
    onboardZerodhaAccount(): void {
        if (!this.onboardingClientId || this.onboardingClientId.trim() === '') {
            this.showOnboardingAlert('Please enter a valid Client ID.', 'error');
            return;
        }

        if (this.onboardingClientId.trim().length != 6) {
            this.showOnboardingAlert('Client ID is invalid.', 'error');
            return;
        }

        this.onboardingLoading = true;

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

                    let errorMessage = 'Failed to create account. Please try again.';

                    if (error.status === 400) {
                        errorMessage = 'Invalid Client ID format. Please check and try again.';
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

    showOnboardingAlert(message: string, type: 'success' | 'error' | 'info'): void {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    resetOnboardingForm(): void {
        this.onboardingClientId = '';
        this.onboardingSuccess = false;
        this.onboardingMessage = '';
        this.showOnboardingForm = false;
    }

    viewHoldings(accountState: AccountState): void {
        if (!accountState.broker.authenticated) {
            this.showAlert('Please connect to Zerodha first.', 'error');
            return;
        }

        accountState.loading = true;

        this.apiService
            .getHodlings(this.buildPortfolioHeaders(accountState.broker.clientId))
            .subscribe({
                next: (response: any) => {
                    accountState.loading = false;
                    let data = response.data;
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

    viewMutualFunds(accountState: AccountState): void {
        if (!accountState.broker.authenticated) {
            this.showAlert('Please connect to Zerodha first.', 'error');
            return;
        }

        accountState.loading = true;

        this.apiService
            .getMutualFunds(this.buildPortfolioHeaders(accountState.broker.clientId))
            .subscribe({
                next: (response: any) => {
                    accountState.loading = false;
                    let data = response.data;
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

    initiateDisconnect(accountState: AccountState): void {
        this.accountToDisconnect = accountState;
        this.showDisconnectModal = true;
    }

    cancelDisconnect(): void {
        this.showDisconnectModal = false;
        this.accountToDisconnect = null;
    }

    confirmDisconnect(): void {
        if (!this.accountToDisconnect) return;

        const accountState = this.accountToDisconnect;
        this.disconnecting = true;
        this.dataDisconnect(accountState);
    }

    private dataDisconnect(accountState: AccountState): void {
        this.apiService
            .disconnectZerodha(
                this.buildPortfolioHeaders(accountState.broker.clientId)
            )
            .subscribe({
                next: (response: any) => {
                    this.disconnecting = false;
                    this.showDisconnectModal = false;
                    this.accountToDisconnect = null;

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
                    this.showDisconnectModal = false;
                    console.error('Error disconnecting Zerodha:', error);
                    this.showAlert('Failed to disconnect. Please try again.', 'error');
                },
            });
    }

    // PORTFOLIO CALCULATIONS
    getTotalInvestment(holdings: PortfolioHolding[]): number {
        return holdings.reduce((total, holding) => total + holding.averagePrice * holding.quantity, 0);
    }

    getCurrentValue(holdings: PortfolioHolding[]): number {
        return holdings.reduce((total, holding) => total + holding.lastPrice * holding.quantity, 0);
    }

    getTotalPnL(holdings: PortfolioHolding[]): number {
        return holdings.reduce((total, holding) => total + holding.pnl, 0);
    }

    getTotalDayChange(holdings: PortfolioHolding[]): number {
        return holdings.reduce((total, holding) => total + holding.dayChange, 0);
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

    // MUTUAL FUND CALCULATIONS
    getMFTotalInvestment(holdings: MutualFundHolding[]): number {
        return holdings.reduce((total, holding) => total + holding.averagePrice * holding.quantity, 0);
    }

    getMFCurrentValue(holdings: MutualFundHolding[]): number {
        return holdings.reduce((total, holding) => total + holding.lastPrice * holding.quantity, 0);
    }

    getMFTotalPnL(holdings: MutualFundHolding[]): number {
        return holdings.reduce((total, holding) => total + holding.pnl, 0);
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
        }
        return headers;
    }
}
