import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './service/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Budget Planner';
  username: string = '';

  isLoggedIn = false;
  private authSubscription: Subscription | undefined;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.authSubscription = this.authService.currentUser.subscribe((user) => {
      this.isLoggedIn = user !== null;
      this.username = user?.username || '';
    });
  }

  /**
   * Check if a route is active
   */
  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  /**
   * Close navbar on mobile after clicking a link
   */
  closeNavbar(): void {
    const navbar = document.querySelector('.navbar-collapse');
    if (navbar) {
      navbar.classList.remove('show');
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout().subscribe(() => {
      this.isLoggedIn = false;
      this.username = '';
      this.router.navigate(['/login']);
    });
  }
}
