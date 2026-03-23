import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AgentService, CreateAgentDto, AgentSource, AgentSourceType, PlatformType } from '../../../core/services/agent.service';
import { ToneOfVoiceService, ToneOfVoice } from '../../../core/services/tone-of-voice.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import {
  ArrowLeft01Icon,
  SparklesIcon,
  PencilEdit01Icon,
  CheckmarkCircle01Icon,
  Link01Icon,
  File01Icon,
  Delete01Icon,
  PlusSignIcon,
  Linkedin01Icon,
  BloggerIcon,
  Globe02Icon,
} from '@hugeicons/core-free-icons';

const MODEL_OPTIONS: Record<string, string[]> = {
  claude: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini'],
};

@Component({
  selector: 'app-agent-form',
  imports: [FormsModule, IconComponent],
  templateUrl: './agent-form.component.html',
  styleUrl: './agent-form.component.scss'
})
export class AgentFormComponent implements OnInit {
  isEdit = false;
  agentId: string | null = null;
  wsId = '';
  loading = signal(false);
  error = signal('');

  // Form
  form: CreateAgentDto & { image_generation_enabled?: boolean; image_prompt?: string; image_count?: number; image_reference_url?: string | null } = {
    name: '',
    tone: 'professional',
    ai_provider: 'claude',
    ai_model: 'claude-opus-4-6',
    platform_type: 'linkedin',
    versions_count: 1,
    image_generation_enabled: false,
    image_prompt: '',
    image_count: 1,
    image_reference_url: null,
  };

  // Reference image
  referenceImagePreview = signal<string | null>(null);
  referenceImageLoading = signal(false);

  readonly versionOptions = [1, 2, 3];
  readonly imageCountOptions = [1, 2, 3, 4];

  scheduleBrief = '';

  tones = ['professional', 'creative', 'technical', 'casual', 'inspirational', 'educational'];

  readonly platforms = [
    { id: 'linkedin' as PlatformType, name: 'LinkedIn', icon: Linkedin01Icon },
    { id: 'blog' as PlatformType, name: 'Blog', icon: BloggerIcon },
    { id: 'generic' as PlatformType, name: 'Generico', icon: Globe02Icon },
  ];
  toneOfVoices = signal<ToneOfVoice[]>([]);
  selectedTovId = '';
  toneMode = signal<'custom' | 'preset'>('preset');

  // Sources
  sources = signal<AgentSource[]>([]);
  newSourceType = signal<AgentSourceType>('url');
  newSourceValue = '';
  newSourceLabel = '';

  // Icons
  readonly icons = {
    arrowLeft: ArrowLeft01Icon,
    sparkles: SparklesIcon,
    edit: PencilEdit01Icon,
    checkmark: CheckmarkCircle01Icon,
    link: Link01Icon,
    file: File01Icon,
    delete: Delete01Icon,
    plus: PlusSignIcon,
  };

  get modelOptions(): string[] {
    return MODEL_OPTIONS[this.form.ai_provider] || [];
  }

  constructor(
    private agentService: AgentService,
    private tovService: ToneOfVoiceService,
    protected router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.wsId = this.route.snapshot.paramMap.get('wsId')!;
    this.tovService.list(this.wsId).subscribe(t => {
      this.toneOfVoices.set(t);
      if (t.length > 0 && !this.isEdit) {
        this.toneMode.set('custom');
      }
    });
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
          platform_type: agent.platform_type || 'linkedin',
          versions_count: agent.versions_count || 1,
          image_generation_enabled: agent.image_generation_enabled || false,
          image_prompt: agent.image_prompt || '',
          image_count: agent.image_count || 1,
          image_reference_url: agent.image_reference_url || null,
        };
        if (agent.image_reference_url) {
          this.referenceImagePreview.set(agent.image_reference_url);
        }
        this.selectedTovId = agent.tone_of_voice_id || '';
        this.scheduleBrief = agent.schedule_brief || '';
        this.sources.set(agent.sources || []);
        if (this.selectedTovId) {
          this.toneMode.set('custom');
        } else {
          this.toneMode.set('preset');
        }
      });
    }
  }

  onProviderChange() {
    const models = MODEL_OPTIONS[this.form.ai_provider];
    this.form.ai_model = models?.[0] || '';
  }

  selectTov(id: string) {
    this.selectedTovId = this.selectedTovId === id ? '' : id;
  }

  selectPresetTone(tone: string) {
    this.form.tone = tone;
    this.selectedTovId = '';
  }

  addSource() {
    const value = this.newSourceValue.trim();
    if (!value) return;

    const source: AgentSource = {
      type: this.newSourceType(),
      value,
      label: this.newSourceLabel.trim() || undefined,
    };

    this.sources.update(s => [...s, source]);
    this.newSourceValue = '';
    this.newSourceLabel = '';
  }

  removeSource(index: number) {
    this.sources.update(s => s.filter((_, i) => i !== index));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.sources.update(s => [...s, {
      type: 'file' as AgentSourceType,
      value: file.name,
      label: file.name,
    }]);
    input.value = '';
  }

  onReferenceImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    input.value = '';

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.referenceImagePreview.set(base64);
      this.referenceImageLoading.set(true);

      this.agentService.uploadReferenceImage(this.wsId, base64).subscribe({
        next: result => {
          this.form.image_reference_url = result.url;
          this.referenceImagePreview.set(result.url);
          // Auto-populate image_prompt with style description if empty
          const currentPrompt = (this.form.image_prompt || '').trim();
          if (!currentPrompt) {
            this.form.image_prompt = result.style_description;
          } else {
            this.form.image_prompt = currentPrompt + '\n\nStile di riferimento: ' + result.style_description;
          }
          this.referenceImageLoading.set(false);
        },
        error: () => {
          this.referenceImagePreview.set(null);
          this.referenceImageLoading.set(false);
          this.error.set('Errore nel caricamento dell\'immagine di riferimento');
        },
      });
    };
    reader.readAsDataURL(file);
  }

  removeReferenceImage() {
    this.referenceImagePreview.set(null);
    this.form.image_reference_url = null;
  }

  onSubmit() {
    this.error.set('');
    this.loading.set(true);

    const currentSources = this.sources();
    const dto: CreateAgentDto = {
      ...this.form,
      tone_of_voice_id: this.selectedTovId || undefined,
      schedule_brief: this.scheduleBrief || undefined,
      sources: currentSources.length > 0 ? currentSources : undefined,
      image_prompt: (this.form.image_prompt as string)?.trim() || undefined,
      image_reference_url: this.form.image_reference_url || null,
    };

    const req = this.isEdit && this.agentId
      ? this.agentService.update(this.wsId, this.agentId, dto)
      : this.agentService.create(this.wsId, dto);

    req.subscribe({
      next: () => this.router.navigate(['/workspaces', this.wsId, 'agents']),
      error: (err) => {
        this.error.set(err.error?.error || 'Failed to save agent');
        this.loading.set(false);
      },
    });
  }

  goBack() {
    this.router.navigate(['/workspaces', this.wsId, 'agents']);
  }
}
