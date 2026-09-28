import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing-module';
import { Auth } from './auth';
import { Login } from './login/login';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [Auth, Login],
  imports: [CommonModule, ReactiveFormsModule, AuthRoutingModule, MatFormFieldModule, MatInputModule, MatButtonModule]
  // `AuthService` and `AuthGuard` are `providedIn: 'root'` on purpose: the HTTP
  // interceptor and the lazily loaded feature modules must share one instance.
})
export class AuthModule {}

