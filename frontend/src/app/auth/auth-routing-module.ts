import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Auth } from './auth';
import { Login } from './login/login';

const routes: Routes = [
  { path: '', component: Auth },
  { path: 'login', component: Login }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
