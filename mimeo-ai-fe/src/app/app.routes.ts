import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'workspaces/:wsId',
        loadComponent: () => import('./features/workspaces/workspace-detail/workspace-detail.component').then(m => m.WorkspaceDetailComponent),
        children: [
          {
            path: 'agents/new',
            loadComponent: () => import('./features/agents/agent-form/agent-form.component').then(m => m.AgentFormComponent),
          },
          {
            path: 'agents/:id/edit',
            loadComponent: () => import('./features/agents/agent-form/agent-form.component').then(m => m.AgentFormComponent),
          },
          {
            path: 'posts/generate',
            loadComponent: () => import('./features/posts/post-generate/post-generate.component').then(m => m.PostGenerateComponent),
          },
          {
            path: 'posts/:id',
            loadComponent: () => import('./features/posts/post-detail/post-detail.component').then(m => m.PostDetailComponent),
          },
        ],
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
