import { Component, EventEmitter, Input, Output, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToneOfVoiceService, ToneOfVoice, TovChatMessage, TovChatResponse } from '../../../core/services/tone-of-voice.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { MarkdownComponent } from 'ngx-markdown';
import {
  Cancel01Icon,
  SparklesIcon,
  PlayIcon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-tov-chat-modal',
  standalone: true,
  imports: [FormsModule, IconComponent, MarkdownComponent],
  templateUrl: './tov-chat-modal.component.html',
  styleUrl: './tov-chat-modal.component.scss',
})
export class TovChatModalComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLElement>;
  private shouldScroll = false;
  @Input({ required: true }) wsId = '';
  @Output() created = new EventEmitter<ToneOfVoice>();
  @Output() closed = new EventEmitter<void>();

  step = signal<'chat' | 'done'>('chat');
  chatMessages = signal<TovChatMessage[]>([]);
  chatLoading = signal(false);
  chatResult = signal<TovChatResponse['result'] | null>(null);
  chatInput = '';

  showChat = computed(() => this.chatMessages().length > 0);

  readonly icons = {
    close: Cancel01Icon,
    sparkles: SparklesIcon,
    send: PlayIcon,
    check: CheckmarkCircle01Icon,
  };

  constructor(private tovService: ToneOfVoiceService) {}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom() {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  sendChat() {
    const msg = this.chatInput.trim();
    if (!msg) return;

    const history = this.chatMessages();
    this.chatMessages.set([...history, { role: 'user', content: msg }]);
    this.chatLoading.set(true);
    this.chatInput = '';
    this.shouldScroll = true;

    this.tovService.sendChat(this.wsId, msg, history).subscribe({
      next: (response) => {
        this.chatMessages.set([...this.chatMessages(), { role: 'assistant', content: response.message }]);
        if (response.done && response.result) {
          this.chatResult.set(response.result);
          this.step.set('done');
        }
        this.chatLoading.set(false);
        this.shouldScroll = true;
      },
      error: () => {
        this.chatMessages.set([...this.chatMessages(), { role: 'assistant', content: 'Si è verificato un errore. Riprova.' }]);
        this.chatLoading.set(false);
        this.shouldScroll = true;
      },
    });
  }

  close() {
    this.closed.emit();
  }

  done() {
    this.closed.emit();
  }
}
