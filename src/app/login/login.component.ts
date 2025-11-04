import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    rememberMe: new FormControl(false)
  });

  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showPassword: boolean = false;
  returnUrl: string = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get return url from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Redirect to dashboard if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    // Validate form
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;
    const rememberMe = this.loginForm.get('rememberMe')?.value || false;

    // Call backend login API through auth service
    this.authService.login(username, password, rememberMe).subscribe({
      next: (success) => {
        if (success) {
          this.successMessage = 'Login successful! Redirecting...';
          setTimeout(() => {
            this.router.navigate([this.returnUrl]);
          }, 500);
        } else {
          this.loading = false;
          this.errorMessage = 'Invalid username or password';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;

        // Handle different error scenarios
        if (error.status === 401) {
          this.errorMessage = 'Invalid username or password';
        } else if (error.status === 403) {
          this.errorMessage = 'Access forbidden. Please contact administrator.';
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please check your connection.';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error occurred. Please try again later.';
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'An error occurred during login. Please try again.';
        }

        console.error('Login error:', error);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
