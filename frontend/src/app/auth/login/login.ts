import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  readonly loginForm: FormGroup;
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  // Convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.error.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    this.authService.login(this.f.username.value, this.f.password.value)
      .subscribe({
        next: () => {
          // Redirect to dashboard after successful login
          this.router.navigate(['/dashboard']);
        },
        error: error => {
          this.error.set(error?.error?.detail || 'Login failed, please check your credentials');
          this.loading.set(false);
        }
      });
  }
}

