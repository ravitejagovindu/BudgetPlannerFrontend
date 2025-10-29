import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  loginForm!: FormGroup;
  loginError: string = '';
  loading: boolean = false;
  isLoggedIn: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in
    this.isLoggedIn = this.authService.isAuthenticated;

    // If logged in, redirect to dashboard
    if (this.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    }

    // Initialize login form
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false],
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.loginError = '';

    const username = this.loginForm.value.username;
    const password = this.loginForm.value.password;
    const rememberMe = this.loginForm.value.rememberMe;

    this.authService.login(username, password).subscribe({
      next: (success: boolean) => {
        this.loading = false;
        if (success) {
          // Redirect to dashboard on successful login
          this.router.navigate(['/dashboard']);
        } else {
          this.loginError = 'Invalid username or password. Please try again.';
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.loginError = 'An error occurred during login. Please try again.';
        console.error('Login error:', error);
      },
    });
  }

  scrollToFeatures(): void {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToLogin(): void {
    const loginSection = document.getElementById('login');
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
