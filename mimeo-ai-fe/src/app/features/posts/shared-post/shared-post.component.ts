import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PostService, Post, PostImage, PostCarousel } from '../../../core/services/post.service';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-shared-post',
  imports: [DatePipe, MarkdownComponent],
  templateUrl: './shared-post.component.html',
  styleUrl: './shared-post.component.scss'
})
export class SharedPostComponent implements OnInit {
  post = signal<Post | null>(null);
  images = signal<PostImage[]>([]);
  carousels = signal<PostCarousel[]>([]);
  error = signal(false);
  previewImage = signal<PostImage | null>(null);

  constructor(
    private postService: PostService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('shareToken')!;
    this.postService.getShared(token).subscribe({
      next: result => {
        this.post.set(result.post);
        this.images.set(result.images);
        this.carousels.set(result.carousels);
      },
      error: () => this.error.set(true),
    });
  }
}
