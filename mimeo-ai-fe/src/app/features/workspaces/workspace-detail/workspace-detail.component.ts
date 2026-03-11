import { Component, OnInit, OnDestroy, signal, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { WorkspaceService, Workspace } from '../../../core/services/workspace.service';
import { AgentService, Agent } from '../../../core/services/agent.service';
import { PostService, Post, PostStatus } from '../../../core/services/post.service';

@Component({
  selector: 'app-workspace-detail',
  imports: [RouterLink, RouterOutlet, DatePipe, SlicePipe],
  templateUrl: './workspace-detail.component.html',
  styleUrl: './workspace-detail.component.scss'
})
export class WorkspaceDetailComponent implements OnInit, OnDestroy {
  workspace = signal<Workspace | null>(null);
  agents = signal<Agent[]>([]);
  posts = signal<Post[]>([]);
  activeTab = signal<'agents' | 'contents'>('agents');
  activeFilter = signal<PostStatus | 'all'>('all');
  isChildRoute = signal(false);
  agentView = signal<'card' | 'list'>('card');
  contentView = signal<'card' | 'list'>('list');
  triggerLoading = signal<string | null>(null);
  triggerError = signal('');
  currentTime = signal(new Date());
  wsId = '';

  private routerSub!: Subscription;
  private timerInterval!: ReturnType<typeof setInterval>;

  constructor(
    private workspaceService: WorkspaceService,
    private agentService: AgentService,
    private postService: PostService,
    private route: ActivatedRoute,
    protected router: Router
  ) {}

  ngOnInit() {
    this.wsId = this.route.snapshot.paramMap.get('wsId')!;
    this.route.paramMap.subscribe(params => {
      this.wsId = params.get('wsId')!;
      this.loadAll();
    });

    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.updateRouteState());
    this.updateRouteState();

    this.timerInterval = setInterval(() => this.currentTime.set(new Date()), 30_000);
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    clearInterval(this.timerInterval);
  }

  private updateRouteState() {
    const url = this.router.url.split('?')[0];
    const base = `/workspaces/${this.wsId}`;

    if (url === base || url === base + '/') {
      this.isChildRoute.set(false);
    } else {
      this.isChildRoute.set(true);
      if (url.includes('/posts/')) {
        this.activeTab.set('contents');
      } else if (url.includes('/agents/')) {
        this.activeTab.set('agents');
      }
    }
  }

  switchTab(tab: 'agents' | 'contents') {
    this.activeTab.set(tab);
    if (this.isChildRoute()) {
      this.router.navigate(['/workspaces', this.wsId]);
    }
    if (tab === 'contents') {
      this.loadPosts();
    }
  }

  loadAll() {
    this.workspaceService.getById(this.wsId).subscribe(ws => this.workspace.set(ws));
    this.agentService.list(this.wsId).subscribe(a => this.agents.set(a));
    this.loadPosts();
  }

  loadPosts() {
    const status = this.activeFilter() === 'all' ? undefined : this.activeFilter() as PostStatus;
    this.postService.list(this.wsId, status).subscribe(p => this.posts.set(p));
  }

  filterBy(status: PostStatus | 'all') {
    this.activeFilter.set(status);
    this.loadPosts();
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
        this.activeTab.set('contents');
        this.router.navigate(['/workspaces', this.wsId, 'posts', result.post.id]);
      },
      error: (err) => {
        this.triggerLoading.set(null);
        this.triggerError.set(err.error?.error || 'Errore durante la generazione del post.');
      },
    });
  }
}
