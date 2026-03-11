import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { AgentService, CreateAgentDto } from '../../../core/services/agent.service';
import { ChatService, ChatMessage, ChatResponse } from '../../../core/services/chat.service';

const MODEL_OPTIONS: Record<string, string[]> = {
  claude: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414'],
  openai: ['gpt-4o', 'gpt-4o-mini'],
};

@Component({
  selector: 'app-agent-form',
  imports: [FormsModule, RouterLink, SlicePipe],
  templateUrl: './agent-form.component.html',
  styleUrl: './agent-form.component.scss'
})
export class AgentFormComponent implements OnInit {
  isEdit = false;
  agentId: string | null = null;
  wsId = '';
  loading = signal(false);
  error = signal('');

  // Mode: 'chat' or 'manual'
  mode = signal<'chat' | 'manual'>('chat');

  // Manual form
  form: CreateAgentDto = {
    name: '',
    tone: 'professional',
    ai_provider: 'claude',
    ai_model: 'claude-sonnet-4-20250514',
  };

  targetAudience = '';
  writingStyleGuidelines = '';
  customSystemPrompt = '';
  scheduleEnabled = false;
  scheduleCron = '';
  scheduleBrief = '';

  tones = ['professional', 'creative', 'technical', 'casual', 'inspirational', 'educational'];

  // Chat
  chatMessages = signal<ChatMessage[]>([]);
  chatLoading = signal(false);
  chatResults = signal<ChatResponse['results'] | null>(null);
  chatInput = '';
  showChat = computed(() => this.chatMessages().length > 0);

  get modelOptions(): string[] {
    return MODEL_OPTIONS[this.form.ai_provider] || [];
  }

  constructor(
    private agentService: AgentService,
    private chatService: ChatService,
    protected router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.wsId = this.route.snapshot.paramMap.get('wsId')!;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.agentId = id;
      this.mode.set('manual');
      this.agentService.getById(this.wsId, id).subscribe(agent => {
        this.form = {
          name: agent.name,
          tone: agent.tone,
          ai_provider: agent.ai_provider,
          ai_model: agent.ai_model,
        };
        this.targetAudience = agent.target_audience || '';
        this.writingStyleGuidelines = agent.writing_style_guidelines || '';
        this.customSystemPrompt = agent.custom_system_prompt || '';
        this.scheduleEnabled = agent.schedule_enabled;
        this.scheduleCron = agent.schedule_cron || '';
        this.scheduleBrief = agent.schedule_brief || '';
      });
    }
  }

  onProviderChange() {
    const models = MODEL_OPTIONS[this.form.ai_provider];
    this.form.ai_model = models?.[0] || '';
  }

  onSubmit() {
    this.error.set('');
    this.loading.set(true);

    const dto: CreateAgentDto = {
      ...this.form,
      target_audience: this.targetAudience || undefined,
      writing_style_guidelines: this.writingStyleGuidelines || undefined,
      custom_system_prompt: this.customSystemPrompt || undefined,
      schedule_brief: this.scheduleBrief || undefined,
      schedule_enabled: this.scheduleEnabled,
      schedule_cron: this.scheduleEnabled ? (this.scheduleCron || undefined) : undefined,
    };

    const req = this.isEdit && this.agentId
      ? this.agentService.update(this.wsId, this.agentId, dto)
      : this.agentService.create(this.wsId, dto);

    req.subscribe({
      next: () => this.router.navigate(['/workspaces', this.wsId]),
      error: (err) => {
        this.error.set(err.error?.error || 'Failed to save agent');
        this.loading.set(false);
      },
    });
  }

  sendChat() {
    if (!this.chatInput.trim()) return;
    const message = this.chatInput.trim();
    const history = this.chatMessages();
    this.chatMessages.set([...history, { role: 'user', content: message }]);
    this.chatLoading.set(true);
    this.chatInput = '';
    this.chatService.send(this.wsId, message, history).subscribe({
      next: (response) => {
        this.chatMessages.set([...this.chatMessages(), { role: 'assistant', content: response.message }]);
        if (response.done && response.results) {
          this.chatResults.set(response.results);
        }
        this.chatLoading.set(false);
      },
      error: () => {
        this.chatMessages.set([...this.chatMessages(), { role: 'assistant', content: 'Si è verificato un errore. Riprova.' }]);
        this.chatLoading.set(false);
      },
    });
  }

  goToWorkspace() {
    this.router.navigate(['/workspaces', this.wsId]);
  }

  goBack() {
    this.router.navigate(['/workspaces', this.wsId]);
  }
}
