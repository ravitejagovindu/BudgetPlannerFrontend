import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../service/api.service';

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

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if redirected back from Zerodha with request_token
    this.route.queryParams.subscribe((params) => {
      const requestToken = params['request_token'];
      const status = params['status'];

      if (requestToken) {
        // User was redirected back from Zerodha
        console.log('REQUEST_TOKEN === ' + requestToken);
        this.generateSession(requestToken);
      } else if (status === 'cancelled') {
        this.showAlert('Zerodha authentication was cancelled.', 'error');
      }
    });

    // Check if already connected (optional: check from backend/storage)
    this.checkExistingConnection();
  }

  connectToZerodha(): void {
    this.loading = true;
    this.closeAlert();

    // Call backend API to get Zerodha login URL
    this.apiService.getZerodhaLoginUrl().subscribe({
      next: (response: any) => {
        this.loading = false;

        if (response && response.data && response.data.loginUrl) {
          // Redirect to Zerodha login page
          window.location.href = response.data.loginUrl;
        } else {
          this.showAlert(
            'Failed to get Zerodha login URL. Please try again.',
            'error'
          );
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error getting Zerodha login URL:', error);
        this.showAlert(
          'Unable to connect to Zerodha. Please try again later.',
          'error'
        );
      },
    });
  }

  generateSession(requestToken: string): void {
    this.loading = true;

    // Call backend API to generate session
    this.apiService.generateZerodhaSession(requestToken).subscribe({
      next: (response: any) => {
        this.loading = false;
        let data = response.data;

        if (data) {
          this.isConnected = true;
          this.connectionDate = new Date();
          this.username = data.userName || 'Zerodha User';

          // Clean up URL (remove query params)
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true,
          });

          this.showAlert('Successfully connected to Zerodha!', 'success');
        } else {
          this.showAlert(
            'Failed to establish Zerodha session. Please try again.',
            'error'
          );
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error generating Zerodha session:', error);
        this.showAlert(
          'Session generation failed. Please try connecting again.',
          'error'
        );
      },
    });
  }

  checkExistingConnection(): void {
    // Optional: Check if user already has an active Zerodha connection
    // This could query your backend to see if session exists
    // For now, we assume no existing connection
    this.isConnected = false;
  }

  disconnect(): void {
    if (confirm('Are you sure you want to disconnect your Zerodha account?')) {
      // TODO: Call backend API to invalidate session
      this.isConnected = false;
      this.showAlert('Zerodha account disconnected successfully.', 'success');
    }
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
}
