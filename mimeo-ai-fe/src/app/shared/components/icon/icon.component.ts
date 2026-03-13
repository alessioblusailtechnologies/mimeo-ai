import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

type IconData = ([string, { [key: string]: string | number }])[]
  | readonly (readonly [string, { readonly [key: string]: string | number }])[];

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span [innerHTML]="svgHtml"></span>`,
  styles: [`:host { display: inline-flex; align-items: center; line-height: 0; } span { display: inline-flex; }`]
})
export class IconComponent implements OnChanges {
  @Input({ required: true }) icon: IconData = [];
  @Input() size = 18;

  svgHtml: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    const items = this.icon as [string, { [key: string]: string | number }][];
    const children = items
      .map(([tag, attrs]) => {
        const attrStr = Object.entries(attrs)
          .filter(([k]) => k !== 'key')
          .map(([k, v]) => `${this.camelToKebab(k)}="${v}"`)
          .join(' ');
        return `<${tag} ${attrStr}/>`;
      })
      .join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.size}" height="${this.size}" viewBox="0 0 24 24" fill="none">${children}</svg>`;
    this.svgHtml = this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  private camelToKebab(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }
}
