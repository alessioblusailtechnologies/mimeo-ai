import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AgentService, Agent } from '../../../core/services/agent.service';
import { PostService } from '../../../core/services/post.service';

@Component({
  selector: 'app-post-generate',
  imports: [FormsModule, RouterLink],
  templateUrl: './post-generate.component.html',
  styleUrl: './post-generate.component.scss'
})
export class PostGenerateComponent implements OnInit {
  agents = signal<Agent[]>([]);
  selectedAgentId = '';
  brief = '';
  title = '';
  loading = signal(false);
  error = signal('');
  wsId = '';

  constructor(
    private agentService: AgentService,
    private postService: PostService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.wsId = this.route.snapshot.paramMap.get('wsId')!;
    const preselectedAgentId = this.route.snapshot.queryParamMap.get('agentId');

    this.agentService.list(this.wsId).subscribe(agents => {
      this.agents.set(agents);
      if (preselectedAgentId) {
        this.selectedAgentId = preselectedAgentId;
      } else if (agents.length > 0) {
        this.selectedAgentId = agents[0].id;
      }
    });
  }

  get selectedAgent(): Agent | undefined {
    return this.agents().find(a => a.id === this.selectedAgentId);
  }

  onSubmit() {
    if (!this.selectedAgentId || !this.brief.trim()) return;

    this.error.set('');
    this.loading.set(true);

    this.postService.generate(
      this.wsId,
      this.selectedAgentId,
      this.brief.trim(),
      this.title.trim() || undefined
    ).subscribe({
      next: result => {
        this.router.navigate(['/workspaces', this.wsId, 'posts', result.post.id]);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Generation failed');
        this.loading.set(false);
      },
    });
  }

  goBack() {
    this.router.navigate(['/workspaces', this.wsId]);
  }
}
