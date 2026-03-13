import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PostService, Post, Generation } from '../../../core/services/post.service';
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
  generations = signal<Generation[]>([]);
  editing = signal(false);
  editContent = '';
  editTitle = '';
  loading = signal(false);
  actionLoading = signal('');
  copied = signal(false);
  wsId = '';

  readonly icons = {
    arrowLeft: ArrowLeft01Icon,
  };

  constructor(
    private postService: PostService,
    private route: ActivatedRoute,
    protected router: Router
  ) {}

  ngOnInit() {
    this.wsId = this.route.snapshot.paramMap.get('wsId')!;
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadPost(id);
    this.postService.getGenerations(this.wsId, id).subscribe(gens => this.generations.set(gens));
  }

  private loadPost(id: string) {
    this.postService.getById(this.wsId, id).subscribe(post => {
      this.post.set(post);
      this.editContent = post.content;
      this.editTitle = post.title || '';
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

  regenerate() {
    const p = this.post();
    if (!p) return;
    this.actionLoading.set('regenerate');
    this.postService.regenerate(this.wsId, p.id).subscribe({
      next: result => {
        this.generations.update(gens => [result.generation, ...gens]);
        this.actionLoading.set('');
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

  goBack() {
    this.router.navigate(['/workspaces', this.wsId]);
  }
}
