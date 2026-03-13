import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ToneOfVoice, TovChatMessage } from '../../../core/services/tone-of-voice.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-tov-detail-modal',
  standalone: true,
  imports: [IconComponent, MarkdownPipe],
  templateUrl: './tov-detail-modal.component.html',
  styleUrl: './tov-detail-modal.component.scss',
})
export class TovDetailModalComponent {
  @Input({ required: true }) tov!: ToneOfVoice;
  @Output() closed = new EventEmitter<void>();

  activeTab = signal<'chat' | 'prompt'>('chat');

  readonly icons = {
    close: Cancel01Icon,
  };

  get chatHistory(): TovChatMessage[] {
    return (this.tov.conversation_history as TovChatMessage[]) || [];
  }

  styleEntries(sp: Record<string, unknown>): [string, string][] {
    return Object.entries(sp)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k.replace(/_/g, ' '), Array.isArray(v) ? v.join(', ') : String(v)]);
  }

  close() {
    this.closed.emit();
  }
}
