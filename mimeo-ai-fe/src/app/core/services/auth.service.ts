import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';

interface AuthSession {
  access_token: string;
  refresh_token: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    session: AuthSession | null;
    user: unknown;
  };
}

interface MeResponse {
  success: boolean;
  data: {
    user: { email?: string; [key: string]: unknown };
    profile: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      linkedin_profile_url: string | null;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(localStorage.getItem('access_token'));
  private readonly _user = signal<MeResponse['data'] | null>(null);

  readonly isAuthenticated = computed(() => !!this._token());
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  register(email: string, password: string, full_name?: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, {
      email, password, full_name
    }).pipe(tap(res => this.handleAuth(res)));
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
      email, password
    }).pipe(tap(res => this.handleAuth(res)));
  }

  loadUser() {
    if (!this._token()) return;
    this.http.get<MeResponse>(`${environment.apiUrl}/auth/me`).subscribe({
      next: res => this._user.set(res.data),
      error: () => this.logout(),
    });
  }

  logout() {
    localStorage.removeItem('access_token');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  private handleAuth(res: AuthResponse) {
    const token = res.data?.session?.access_token;
    if (token) {
      localStorage.setItem('access_token', token);
      this._token.set(token);
      this.loadUser();
    }
  }
}
