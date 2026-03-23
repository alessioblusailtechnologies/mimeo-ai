import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { tap, Observable, Subject, switchMap, catchError, EMPTY } from 'rxjs';

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

  private _refreshing = false;
  private _refreshSubject = new Subject<string>();

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
    localStorage.removeItem('refresh_token');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  /**
   * Attempts to refresh the access token using the stored refresh_token.
   * Returns an observable that emits the new access token.
   * Coalesces concurrent refresh attempts into a single request.
   */
  refreshToken(): Observable<string> {
    if (this._refreshing) {
      return this._refreshSubject.asObservable();
    }

    this._refreshing = true;
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      this._refreshing = false;
      this.logout();
      return EMPTY;
    }

    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {
      refresh_token: refreshToken
    }).pipe(
      tap(res => {
        const session = res.data?.session;
        if (session) {
          localStorage.setItem('access_token', session.access_token);
          localStorage.setItem('refresh_token', session.refresh_token);
          this._token.set(session.access_token);
          this._refreshSubject.next(session.access_token);
        }
        this._refreshing = false;
      }),
      catchError(() => {
        this._refreshing = false;
        this.logout();
        return EMPTY;
      }),
      switchMap(() => {
        const token = this._token();
        return token ? new Observable<string>(sub => { sub.next(token); sub.complete(); }) : EMPTY;
      })
    );
  }

  get isRefreshing() { return this._refreshing; }
  get refreshSubject$() { return this._refreshSubject.asObservable(); }

  private handleAuth(res: AuthResponse) {
    const session = res.data?.session;
    if (session) {
      localStorage.setItem('access_token', session.access_token);
      localStorage.setItem('refresh_token', session.refresh_token);
      this._token.set(session.access_token);
      this.loadUser();
    }
  }
}
