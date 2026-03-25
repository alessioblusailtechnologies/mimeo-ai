import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'app-email-confirmed',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="logo-row">
          <app-logo size="md" />
        </div>

        <div class="check-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>

        <h2>Email confirmed</h2>
        <p class="desc">Your email has been successfully verified. You can now log in to your account.</p>

        <a routerLink="/login" class="btn-primary">Go to login</a>
      </div>
    </div>
  `,
  styleUrl: './email-confirmed.component.scss',
})
export class EmailConfirmedComponent {}
