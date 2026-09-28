import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService, AuthSession } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html'
})
export class Dashboard {
  readonly session$: Observable<AuthSession | null>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.session$ = this.authService.currentUser;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}


