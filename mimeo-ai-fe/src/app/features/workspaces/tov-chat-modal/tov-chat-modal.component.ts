import { Component, EventEmitter, Input, Output, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToneOfVoiceService, ToneOfVoice, TovChatMessage, TovChatResponse } from '../../../core/services/tone-of-voice.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import {
  Cancel01Icon,
  SparklesIcon,
  PlayIcon,
  Linkedin01Icon,
  TwitterIcon,
  BloggerIcon,
  Globe02Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-tov-chat-modal',
  standalone: true,
  imports: [FormsModule, IconComponent, MarkdownPipe],
  templateUrl: './tov-chat-modal.component.html',
  styleUrl: './tov-chat-modal.component.scss',
})
export class TovChatModalComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLElement>;
  private shouldScroll = false;
  @Input({ required: true }) wsId = '';
  @Output() created = new EventEmitter<ToneOfVoice>();
  @Output() closed = new EventEmitter<void>();

  step = signal<'platform' | 'chat' | 'done'>('platform');
  platformType = signal('linkedin');
  chatMessages = signal<TovChatMessage[]>([]);
  chatLoading = signal(false);
  chatResult = signal<TovChatResponse['result'] | null>(null);
  chatInput = '';

  showChat = computed(() => this.chatMessages().length > 0);

  readonly icons = {
    close: Cancel01Icon,
    sparkles: SparklesIcon,
    send: PlayIcon,
    linkedin: Linkedin01Icon,
    twitter: TwitterIcon,
    blog: BloggerIcon,
    generic: Globe02Icon,
    check: CheckmarkCircle01Icon,
  };

  readonly platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin01Icon },
    { id: 'twitter', name: 'Twitter / X', icon: TwitterIcon },
    { id: 'blog', name: 'Blog', icon: BloggerIcon },
    { id: 'generic', name: 'Generico', icon: Globe02Icon },
  ];

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

  selectPlatform(id: string) {
    this.platformType.set(id);
    this.step.set('chat');
  }

  sendChat() {
    const msg = this.chatInput.trim();
    if (!msg) return;

    const history = this.chatMessages();
    this.chatMessages.set([...history, { role: 'user', content: msg }]);
    this.chatLoading.set(true);
    this.chatInput = '';
    this.shouldScroll = true;

    this.tovService.sendChat(this.wsId, msg, history, this.platformType()).subscribe({
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
