import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../services/api.config';

const TOKEN_KEY = 'access_token';
const USERNAME_KEY = 'username';

/** Response of `POST /api/v1/users/login` (OAuth2 password flow). */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/** Everything the backend exposes about the currently signed-in user. */
export interface AuthSession {
  username: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${API_BASE_URL}/users`;
  private currentUserSubject = new BehaviorSubject<AuthSession | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = this.getToken();
    const username = localStorage.getItem(USERNAME_KEY);
    if (token && username) {
      this.currentUserSubject.next({ username, token });
    }
  }

  /**
   * The backend login endpoint expects an OAuth2 password form
   * (`username` + `password`) and answers with a bearer token only.
   */
  login(username: string, password: string): Observable<TokenResponse> {
    const body = new HttpParams({ fromObject: { username, password } }).toString();

    return this.http
      .post<TokenResponse>(`${this.apiUrl}/login`, body, {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
      })
      .pipe(
        tap((response) => {
          localStorage.setItem(TOKEN_KEY, response.access_token);
          localStorage.setItem(USERNAME_KEY, username);
          this.currentUserSubject.next({ username, token: response.access_token });
        })
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): AuthSession | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
