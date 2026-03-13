import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { WorkspaceService, Workspace } from '../../../core/services/workspace.service';
import { IconComponent } from '../icon/icon.component';
import { LogoComponent } from '../logo/logo.component';
import {
  Logout01Icon,
  Tick01Icon,
  Cancel01Icon,
  PencilEdit01Icon,
  Delete01Icon,
  Rocket01Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, UpperCasePipe, IconComponent, LogoComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  workspaces = signal<Workspace[]>([]);
  noWorkspaces = signal(false);

  // Modal state
  showWsModal = signal(false);
  newWsName = '';
  newWsDesc = '';

  // Edit workspace (inline in sidebar)
  editingWsId = signal<string | null>(null);
  editWsName = '';

  // Icons
  readonly icons = {
    logout: Logout01Icon,
    tick: Tick01Icon,
    cancel: Cancel01Icon,
    edit: PencilEdit01Icon,
    delete: Delete01Icon,
    rocket: Rocket01Icon,
    plus: PlusSignIcon,
  };

  constructor(
    protected authService: AuthService,
    private workspaceService: WorkspaceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadWorkspaces();
  }

  loadWorkspaces() {
    this.workspaceService.list().subscribe(ws => {
      this.workspaces.set(ws);
      if (ws.length > 0) {
        this.noWorkspaces.set(false);
        // Auto-navigate to first workspace if on root
        const url = this.router.url;
        if (url === '/' || url === '') {
          this.router.navigate(['/workspaces', ws[0].id]);
        }
      } else {
        this.noWorkspaces.set(true);
      }
    });
  }

  openWsModal() {
    this.newWsName = '';
    this.newWsDesc = '';
    this.showWsModal.set(true);
  }

  closeWsModal() {
    this.showWsModal.set(false);
  }

  createWorkspace() {
    const name = this.newWsName.trim();
    if (!name) return;
    this.workspaceService.create({ name, description: this.newWsDesc.trim() || undefined }).subscribe(ws => {
      this.showWsModal.set(false);
      this.loadWorkspaces();
      this.router.navigate(['/workspaces', ws.id]);
    });
  }

  // Inline edit in sidebar
  startWsEdit(ws: Workspace, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.editingWsId.set(ws.id);
    this.editWsName = ws.name;
  }

  saveWsEdit(ws: Workspace, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const name = this.editWsName.trim();
    if (!name) return;
    this.workspaceService.update(ws.id, { name }).subscribe(() => {
      this.editingWsId.set(null);
      this.loadWorkspaces();
    });
  }

  cancelWsEdit(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.editingWsId.set(null);
  }

  deleteWorkspace(ws: Workspace, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (!confirm(`Eliminare "${ws.name}" e tutti i suoi agenti/contenuti?`)) return;
    this.workspaceService.delete(ws.id).subscribe(() => {
      this.loadWorkspaces();
      // If we were viewing that workspace, go to first available
      if (this.router.url.includes(ws.id)) {
        const remaining = this.workspaces().filter(w => w.id !== ws.id);
        if (remaining.length > 0) {
          this.router.navigate(['/workspaces', remaining[0].id]);
        } else {
          this.router.navigate(['/']);
        }
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
