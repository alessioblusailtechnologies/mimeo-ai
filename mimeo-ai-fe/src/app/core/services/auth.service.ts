import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { tap, Observable, catchError, EMPTY, share } from 'rxjs';

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

  /** Shared in-flight refresh observable — all concurrent 401s reuse this */
  private _refresh$: Observable<string> | null = null;

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
    this._refresh$ = null;
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  get isRefreshing(): boolean {
    return this._refresh$ !== null;
  }

  /**
   * Refreshes the access token. All concurrent callers share the same
   * in-flight HTTP request and all receive the new token.
   */
  refreshToken(): Observable<string> {
    if (this._refresh$) {
      return this._refresh$;
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.logout();
      return EMPTY;
    }

    this._refresh$ = new Observable<string>(subscriber => {
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {
        refresh_token: refreshToken
      }).subscribe({
        next: res => {
          const session = res.data?.session;
          if (session) {
            localStorage.setItem('access_token', session.access_token);
            localStorage.setItem('refresh_token', session.refresh_token);
            this._token.set(session.access_token);
            subscriber.next(session.access_token);
            subscriber.complete();
          } else {
            subscriber.error(new Error('No session returned'));
          }
        },
        error: err => {
          this._refresh$ = null;
          this.logout();
          subscriber.error(err);
        },
        complete: () => {
          this._refresh$ = null;
        }
      });
    }).pipe(
      share()  // multicast: all concurrent subscribers share the same execution
    );

    return this._refresh$;
  }

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
