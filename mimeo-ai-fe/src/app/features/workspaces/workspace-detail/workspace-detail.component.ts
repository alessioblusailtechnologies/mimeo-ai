import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { WorkspaceService, Workspace } from '../../../core/services/workspace.service';
import { AgentService, Agent } from '../../../core/services/agent.service';
import { PostService, Post, PostStatus } from '../../../core/services/post.service';
import { ToneOfVoiceService, ToneOfVoice } from '../../../core/services/tone-of-voice.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { LinkedInService, LinkedInConnectionInfo, LinkedInOrganization } from '../../../core/services/linkedin.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { TovChatModalComponent } from '../tov-chat-modal/tov-chat-modal.component';
import { TovDetailModalComponent } from '../tov-detail-modal/tov-detail-modal.component';
import {
  ArtificialIntelligence01Icon,
  File01Icon,
  Settings01Icon,
  DashboardSquare01Icon,
  Menu01Icon,
  Clock01Icon,
  PlayIcon,
  PencilEdit01Icon,
  Delete01Icon,
  PlusSignIcon,
  VoiceIcon,
  Copy01Icon,
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-workspace-detail',
  imports: [RouterLink, RouterOutlet, DatePipe, SlicePipe, IconComponent, TovChatModalComponent, TovDetailModalComponent],
  templateUrl: './workspace-detail.component.html',
  styleUrl: './workspace-detail.component.scss'
})
export class WorkspaceDetailComponent implements OnInit, OnDestroy {
  workspace = signal<Workspace | null>(null);
  agents = signal<Agent[]>([]);
  posts = signal<Post[]>([]);
  toneOfVoices = signal<ToneOfVoice[]>([]);
  activeFilter = signal<PostStatus | 'all'>('all');
  isChildRoute = signal(false);
  agentView = signal<'card' | 'list'>('list');
  contentView = signal<'card' | 'list'>('list');
  triggerLoading = signal<string | null>(null);
  triggerError = signal('');
  showTovModal = signal(false);
  selectedTov = signal<ToneOfVoice | null>(null);
  wsId = '';

  // LinkedIn
  linkedInConnection = signal<LinkedInConnectionInfo | null>(null);
  linkedInOrgs = signal<LinkedInOrganization[]>([]);
  linkedInLoading = signal(false);
  showOrgPicker = signal(false);

  agentMap = computed(() => {
    const map: Record<string, string> = {};
    for (const a of this.agents()) map[a.id] = a.name;
    return map;
  });

  agentFullMap = computed(() => {
    const map: Record<string, Agent> = {};
    for (const a of this.agents()) map[a.id] = a;
    return map;
  });

  tovMap = computed(() => {
    const map: Record<string, ToneOfVoice> = {};
    for (const t of this.toneOfVoices()) map[t.id] = t;
    return map;
  });

  // Icons
  readonly icons = {
    agents: ArtificialIntelligence01Icon,
    file: File01Icon,
    settings: Settings01Icon,
    gridView: DashboardSquare01Icon,
    listView: Menu01Icon,
    clock: Clock01Icon,
    play: PlayIcon,
    edit: PencilEdit01Icon,
    delete: Delete01Icon,
    plus: PlusSignIcon,
    voice: VoiceIcon,
    copy: Copy01Icon,
  };

  private routerSub!: Subscription;

  constructor(
    private workspaceService: WorkspaceService,
    private agentService: AgentService,
    private postService: PostService,
    private tovService: ToneOfVoiceService,
    private linkedInService: LinkedInService,
    private route: ActivatedRoute,
    protected router: Router,
    protected navService: NavigationService
  ) {
    // React to sidebar section changes for data refresh
    effect(() => {
      const section = this.navService.activeSection();
      if (this.wsId) {
        if (section === 'contents') this.loadPosts();
        if (section === 'tov') this.loadTovs();
      }
    });
  }

  ngOnInit() {
    this.wsId = this.route.snapshot.paramMap.get('wsId')!;

    // Handle LinkedIn OAuth callback redirect
    this.route.queryParamMap.subscribe(qp => {
      const orgsJson = qp.get('linkedin_orgs');
      if (orgsJson) {
        try {
          const orgs = JSON.parse(orgsJson) as LinkedInOrganization[];
          this.linkedInOrgs.set(orgs);
          this.showOrgPicker.set(true);
          this.navService.activeSection.set('integrations');
          // Clean up query params
          this.router.navigate([], { queryParams: {}, replaceUrl: true });
        } catch { /* ignore parse errors */ }
      }
    });

    this.route.paramMap.subscribe(params => {
      this.wsId = params.get('wsId')!;
      this.loadAll();
    });

    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.updateRouteState());
    this.updateRouteState();
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  private updateRouteState() {
    const url = this.router.url.split('?')[0];
    const base = `/workspaces/${this.wsId}`;
    const suffix = url.startsWith(base) ? url.slice(base.length).replace(/^\//, '') : '';
    const firstSegment = suffix.split('/')[0];
    const wasChild = this.isChildRoute();

    const sections = ['agents', 'contents', 'tov', 'integrations'];

    if (!suffix || sections.includes(suffix)) {
      // Section route (e.g. /workspaces/:id/agents)
      this.isChildRoute.set(false);
      if (wasChild) {
        this.loadAll();
      }
      if (sections.includes(firstSegment)) {
        this.navService.activeSection.set(firstSegment as any);
      }
    } else {
      // Child route (e.g. /workspaces/:id/agents/new, /posts/:id)
      this.isChildRoute.set(true);
      if (firstSegment === 'posts') {
        this.navService.activeSection.set('contents');
      } else if (firstSegment === 'agents') {
        this.navService.activeSection.set('agents');
      }
    }
  }

  loadAll() {
    this.workspaceService.getById(this.wsId).subscribe(ws => this.workspace.set(ws));
    this.agentService.list(this.wsId).subscribe(a => this.agents.set(a));
    this.loadPosts();
    this.loadTovs();
    this.loadLinkedInConnection();
  }

  loadLinkedInConnection() {
    this.linkedInService.getConnection(this.wsId).subscribe({
      next: conn => this.linkedInConnection.set(conn),
      error: () => {},
    });
  }

  connectLinkedIn() {
    this.linkedInLoading.set(true);
    const redirectUri = `${window.location.origin}/linkedin/callback`;
    this.linkedInService.getOAuthUrl(this.wsId, redirectUri).subscribe({
      next: (result) => {
        window.location.href = result.url;
      },
      error: () => this.linkedInLoading.set(false),
    });
  }

  disconnectLinkedIn() {
    if (!confirm('Disconnettere LinkedIn da questo workspace?')) return;
    this.linkedInService.disconnect(this.wsId).subscribe({
      next: () => this.linkedInConnection.set(null),
    });
  }

  selectOrganization(org: LinkedInOrganization) {
    this.linkedInLoading.set(true);
    this.linkedInService.selectOrganization(this.wsId, org.id, org.name, org.logo_url || undefined).subscribe({
      next: (conn) => {
        this.linkedInConnection.set(conn);
        this.showOrgPicker.set(false);
        this.linkedInOrgs.set([]);
        this.linkedInLoading.set(false);
      },
      error: () => this.linkedInLoading.set(false),
    });
  }

  loadPosts() {
    const status = this.activeFilter() === 'all' ? undefined : this.activeFilter() as PostStatus;
    this.postService.list(this.wsId, status).subscribe(p => this.posts.set(p));
  }

  loadTovs() {
    this.tovService.list(this.wsId).subscribe(t => this.toneOfVoices.set(t));
  }

  filterBy(status: PostStatus | 'all') {
    this.activeFilter.set(status);
    this.loadPosts();
  }

  duplicateAgent(id: string) {
    this.agentService.duplicate(this.wsId, id).subscribe(() => {
      this.agentService.list(this.wsId).subscribe(a => this.agents.set(a));
    });
  }

  deleteAgent(id: string) {
    if (!confirm('Eliminare questo agente?')) return;
    this.agentService.delete(this.wsId, id).subscribe(() => {
      this.agentService.list(this.wsId).subscribe(a => this.agents.set(a));
    });
  }

  triggerAgent(agent: Agent) {
    if (!agent.schedule_brief) {
      this.triggerError.set(`L'agente "${agent.name}" non ha un brief configurato. Modificalo per aggiungerne uno.`);
      return;
    }
    this.triggerError.set('');
    this.triggerLoading.set(agent.id);
    this.postService.generate(this.wsId, agent.id, agent.schedule_brief).subscribe({
      next: (result) => {
        this.triggerLoading.set(null);
        this.loadPosts();
        this.navService.activeSection.set('contents');
        this.router.navigate(['/workspaces', this.wsId, 'posts', result.post.id]);
      },
      error: (err) => {
        this.triggerLoading.set(null);
        this.triggerError.set(err.error?.error || 'Errore durante la generazione del post.');
      },
    });
  }

  deleteTov(id: string) {
    if (!confirm('Eliminare questo Tone of Voice?')) return;
    this.tovService.delete(this.wsId, id).subscribe(() => this.loadTovs());
  }

  onTovCreated() {
    this.showTovModal.set(false);
    this.loadTovs();
  }

  getAgentTov(agent: Agent): string {
    if (agent.tone_of_voice_id) {
      const tov = this.tovMap()[agent.tone_of_voice_id];
      return tov?.name || agent.tone;
    }
    return agent.tone;
  }

  getPostTov(post: Post): string {
    const agent = this.agentFullMap()[post.agent_id];
    if (!agent) return '-';
    return this.getAgentTov(agent);
  }

  getPostChannel(post: Post): string {
    const agent = this.agentFullMap()[post.agent_id];
    return agent?.platform_type || '-';
  }
}
