import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  activeSection = signal<'agents' | 'contents' | 'tov' | 'integrations'>('contents');
}
