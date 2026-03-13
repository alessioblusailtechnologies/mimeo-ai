import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div class="logo-wrap" [class.small]="size === 'sm'" [class.large]="size === 'lg'">
      <div class="m-icon">
        <div class="m-line"></div>
        <div class="m-line"></div>
        <div class="m-line"></div>
      </div>
      @if (!iconOnly) {
        <div class="wordmark">
          <span class="name">mimeo<span class="accent">.ai</span></span>
          @if (showTagline) {
            <span class="tagline">your voice, in every content</span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }

    .logo-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .m-icon {
      width: 28px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .m-line {
      height: 2px;
      border-radius: 1px;
    }

    .m-line:nth-child(1) { width: 100%; background: var(--text-1, #F0EDE8); }
    .m-line:nth-child(2) { width: 68%; background: var(--text-1, #F0EDE8); }
    .m-line:nth-child(3) { width: 40%; background: var(--accent, #4A8FFF); }

    .wordmark {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .name {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -1.2px;
      line-height: 1;
      color: var(--text-1, #F0EDE8);
    }

    .accent { color: var(--accent, #4A8FFF); }

    .tagline {
      font-size: 9px;
      font-weight: 400;
      letter-spacing: 0.2px;
      color: var(--text-3, #555);
      padding-left: 1px;
    }

    /* Small variant (sidebar) */
    .small .m-icon { width: 22px; gap: 4px; }
    .small .m-line { height: 1.5px; }
    .small .name { font-size: 15px; letter-spacing: -0.8px; }
    .small .logo-wrap { gap: 10px; }

    /* Large variant (auth pages) */
    .large .m-icon { width: 36px; gap: 7px; }
    .large .m-line { height: 2.5px; }
    .large .name { font-size: 32px; letter-spacing: -2px; }
    .large .logo-wrap { gap: 16px; }
  `]
})
export class LogoComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() iconOnly = false;
  @Input() showTagline = false;
}
