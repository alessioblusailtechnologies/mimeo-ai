import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LinkedInService } from '../../../core/services/linkedin.service';

@Component({
  selector: 'app-linkedin-callback',
  template: `
    <div class="callback-page">
      @if (error()) {
        <p class="error">{{ error() }}</p>
        <button class="btn" (click)="goBack()">Torna al workspace</button>
      } @else {
        <p>Connessione a LinkedIn in corso...</p>
      }
    </div>
  `,
  styles: [`
    .callback-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 16px;
      color: var(--text-2);
      font-size: 14px;
    }
    .error { color: var(--red); }
    .btn {
      padding: 8px 16px;
      background: var(--bg-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-1);
      cursor: pointer;
      font-family: inherit;
    }
  `],
})
export class LinkedInCallbackComponent implements OnInit {
  error = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private linkedInService: LinkedInService
  ) {}

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');

    if (!code || !state) {
      this.error.set('Invalid LinkedIn callback. Missing code or state.');
      return;
    }

    const workspaceId = state.split(':')[0];
    const redirectUri = `${window.location.origin}/linkedin/callback`;

    this.linkedInService.exchangeCode(workspaceId, code, redirectUri).subscribe({
      next: (result) => {
        this.router.navigate(['/workspaces', workspaceId, 'integrations'], {
          queryParams: { linkedin_orgs: JSON.stringify(result.organizations) },
        });
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Failed to connect LinkedIn');
      },
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
