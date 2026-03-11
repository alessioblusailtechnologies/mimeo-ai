import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AgentService, CreateAgentDto } from '../../../core/services/agent.service';

const MODEL_OPTIONS: Record<string, string[]> = {
  claude: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414'],
  openai: ['gpt-4o', 'gpt-4o-mini'],
};

@Component({
  selector: 'app-agent-form',
  imports: [FormsModule],
  templateUrl: './agent-form.component.html',
  styleUrl: './agent-form.component.scss'
})
export class AgentFormComponent implements OnInit {
  isEdit = false;
  agentId: string | null = null;
  wsId = '';
  loading = signal(false);
  error = signal('');

  form: CreateAgentDto = {
    name: '',
    tone: 'professional',
    ai_provider: 'claude',
    ai_model: 'claude-sonnet-4-20250514',
  };

  targetAudience = '';
  writingStyleGuidelines = '';
  customSystemPrompt = '';

  // Schedule
  scheduleEnabled = false;
  scheduleCron = '';
  scheduleBrief = '';

  tones = ['professional', 'creative', 'technical', 'casual', 'inspirational', 'educational'];

  get modelOptions(): string[] {
    return MODEL_OPTIONS[this.form.ai_provider] || [];
  }

  constructor(
    private agentService: AgentService,
    protected router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.wsId = this.route.snapshot.paramMap.get('wsId')!;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.agentId = id;
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
      schedule_enabled: this.scheduleEnabled,
      schedule_cron: this.scheduleCron || undefined,
      schedule_brief: this.scheduleBrief || undefined,
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

  goBack() {
    this.router.navigate(['/workspaces', this.wsId]);
  }
}
