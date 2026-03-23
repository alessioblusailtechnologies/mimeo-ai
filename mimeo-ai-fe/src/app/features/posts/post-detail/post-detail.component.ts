import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PostService, Post, Generation, PostImage } from '../../../core/services/post.service';
import { AgentService, Agent } from '../../../core/services/agent.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-post-detail',
  imports: [FormsModule, DatePipe, IconComponent, MarkdownPipe],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {
  post = signal<Post | null>(null);
  agent = signal<Agent | null>(null);
  generations = signal<Generation[]>([]);
  editing = signal(false);
  editContent = '';
  editTitle = '';
  loading = signal(false);
  actionLoading = signal('');
  copied = signal(false);
  wsId = '';
  activeVersionTab = signal(0);
  showFeedbackInput = signal(false);
  feedbackText = '';

  // Image generation
  postImages = signal<PostImage[]>([]);
  showImageGen = signal(false);
  imagePrompt = '';
  imageCount = 1;
  imageLoading = signal(false);
  showImageFeedback = signal(false);
  imageFeedbackText = '';

  agentHasImageGen = computed(() => this.agent()?.image_generation_enabled === true);

  versionsCount = computed(() => this.agent()?.versions_count || 1);

  // Initial versions (first N generations created together)
  initialVersions = computed(() => {
    const gens = this.generations();
    const count = this.versionsCount();
    if (count <= 1 || gens.length === 0) return [];
    // Initial versions are the last N in the array (oldest, created together)
    // Generations are ordered newest-first from the API
    return gens.slice(-count).reverse();
  });

  // History: all generations after the initial batch
  historyGenerations = computed(() => {
    const gens = this.generations();
    const count = this.versionsCount();
    if (count <= 1) return gens;
    // Everything except the last N (the initial batch)
    const history = gens.slice(0, -count);
    return history;
  });

  hasMultipleVersions = computed(() => this.initialVersions().length > 1);

  readonly icons = {
    arrowLeft: ArrowLeft01Icon,
  };

  constructor(
    private postService: PostService,
    private agentService: AgentService,
    private route: ActivatedRoute,
    protected router: Router
  ) {}

  ngOnInit() {
    this.wsId = this.route.snapshot.paramMap.get('wsId')!;
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadPost(id);
    this.postService.getGenerations(this.wsId, id).subscribe(gens => this.generations.set(gens));
    this.postService.getImages(this.wsId, id).subscribe(imgs => this.postImages.set(imgs));
  }

  private loadPost(id: string) {
    this.postService.getById(this.wsId, id).subscribe(post => {
      this.post.set(post);
      this.editContent = post.content;
      this.editTitle = post.title || '';
      // Load agent to know versions_count
      if (post.agent_id) {
        this.agentService.getById(this.wsId, post.agent_id).subscribe({
          next: agent => this.agent.set(agent),
          error: () => {},
        });
      }
    });
  }

  startEdit() {
    const p = this.post();
    if (!p) return;
    this.editContent = p.content;
    this.editTitle = p.title || '';
    this.editing.set(true);
  }

  cancelEdit() {
    this.editing.set(false);
  }

  saveEdit() {
    const p = this.post();
    if (!p) return;
    this.loading.set(true);
    this.postService.update(this.wsId, p.id, { content: this.editContent, title: this.editTitle || undefined }).subscribe({
      next: updated => {
        this.post.set(updated);
        this.editing.set(false);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleFeedback() {
    this.showFeedbackInput.update(v => !v);
    if (!this.showFeedbackInput()) this.feedbackText = '';
  }

  regenerate() {
    const p = this.post();
    if (!p) return;
    this.actionLoading.set('regenerate');
    const feedback = this.feedbackText.trim() || undefined;
    this.postService.regenerate(this.wsId, p.id, feedback).subscribe({
      next: result => {
        this.generations.update(gens => [result.generation, ...gens]);
        this.actionLoading.set('');
        this.feedbackText = '';
        this.showFeedbackInput.set(false);
      },
      error: () => this.actionLoading.set(''),
    });
  }

  selectGeneration(gen: Generation) {
    const p = this.post();
    if (!p) return;
    this.actionLoading.set('select-' + gen.id);
    this.postService.selectGeneration(this.wsId, p.id, gen.id).subscribe({
      next: updated => {
        this.post.set(updated);
        this.editContent = updated.content;
        this.generations.update(gens =>
          gens.map(g => ({ ...g, is_selected: g.id === gen.id }))
        );
        this.actionLoading.set('');
      },
      error: () => this.actionLoading.set(''),
    });
  }

  approve() {
    const p = this.post();
    if (!p) return;
    this.actionLoading.set('approve');
    this.postService.approve(this.wsId, p.id).subscribe({
      next: updated => {
        this.post.set(updated);
        this.actionLoading.set('');
      },
      error: () => this.actionLoading.set(''),
    });
  }

  publish() {
    const p = this.post();
    if (!p) return;
    this.actionLoading.set('publish');
    this.postService.publish(this.wsId, p.id).subscribe({
      next: updated => {
        this.post.set(updated);
        this.actionLoading.set('');
      },
      error: () => this.actionLoading.set(''),
    });
  }

  copyToClipboard() {
    const p = this.post();
    if (!p) return;
    navigator.clipboard.writeText(p.content).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  toggleImageGen() {
    this.showImageGen.update(v => !v);
    if (!this.showImageGen()) {
      this.imagePrompt = '';
      this.imageCount = 1;
    }
  }

  generateImages() {
    const p = this.post();
    if (!p || !this.imagePrompt.trim()) return;
    this.imageLoading.set(true);
    this.postService.generateImages(this.wsId, p.id, this.imagePrompt.trim(), this.imageCount).subscribe({
      next: images => {
        this.postImages.update(existing => [...images, ...existing]);
        this.imageLoading.set(false);
        this.imagePrompt = '';
        this.showImageGen.set(false);
      },
      error: () => this.imageLoading.set(false),
    });
  }

  toggleImageFeedback() {
    this.showImageFeedback.update(v => !v);
    if (!this.showImageFeedback()) this.imageFeedbackText = '';
  }

  regenerateImages() {
    const p = this.post();
    if (!p) return;
    this.imageLoading.set(true);
    const feedback = this.imageFeedbackText.trim() || undefined;
    this.postService.regenerateImages(this.wsId, p.id, feedback).subscribe({
      next: images => {
        this.postImages.update(existing => [...images, ...existing]);
        this.imageLoading.set(false);
        this.imageFeedbackText = '';
        this.showImageFeedback.set(false);
      },
      error: () => this.imageLoading.set(false),
    });
  }

  deleteImage(img: PostImage) {
    const p = this.post();
    if (!p) return;
    this.postService.deleteImage(this.wsId, p.id, img.id).subscribe({
      next: () => this.postImages.update(imgs => imgs.filter(i => i.id !== img.id)),
    });
  }

  goBack() {
    this.router.navigate(['/workspaces', this.wsId]);
  }
}
