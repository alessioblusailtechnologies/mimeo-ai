import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe, DatePipe } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { WorkspaceService, Workspace } from '../../../core/services/workspace.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NavigationService } from '../../../core/services/navigation.service';
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
  ArtificialIntelligence01Icon,
  File01Icon,
  VoiceIcon,
  Link01Icon,
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, FormsModule, UpperCasePipe, DatePipe, IconComponent, LogoComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  workspaces = signal<Workspace[]>([]);
  noWorkspaces = signal(false);
  wsDropdownOpen = signal(false);
  activeWsId = signal<string | null>(null);
  currentTime = signal(new Date());

  // Modal state
  showWsModal = signal(false);
  newWsName = '';
  newWsDesc = '';

  // Edit workspace
  editingWsId = signal<string | null>(null);
  editWsName = '';

  activeWsName = computed(() => {
    const id = this.activeWsId();
    const ws = this.workspaces().find(w => w.id === id);
    return ws?.name || 'Seleziona Workspace';
  });

  // Icons
  readonly icons = {
    logout: Logout01Icon,
    tick: Tick01Icon,
    cancel: Cancel01Icon,
    edit: PencilEdit01Icon,
    delete: Delete01Icon,
    rocket: Rocket01Icon,
    plus: PlusSignIcon,
    agents: ArtificialIntelligence01Icon,
    file: File01Icon,
    voice: VoiceIcon,
    integrations: Link01Icon,
  };

  private routerSub!: Subscription;
  private timerInterval!: ReturnType<typeof setInterval>;

  constructor(
    protected authService: AuthService,
    private workspaceService: WorkspaceService,
    private router: Router,
    protected themeService: ThemeService,
    protected navService: NavigationService
  ) {}

  ngOnInit() {
    this.loadWorkspaces();
    this.updateActiveWs();

    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.updateActiveWs());

    this.timerInterval = setInterval(() => this.currentTime.set(new Date()), 30_000);
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    clearInterval(this.timerInterval);
  }

  private updateActiveWs() {
    const match = this.router.url.match(/\/workspaces\/([^\/\?]+)/);
    this.activeWsId.set(match ? match[1] : null);
  }

  loadWorkspaces() {
    this.workspaceService.list().subscribe(ws => {
      this.workspaces.set(ws);
      if (ws.length > 0) {
        this.noWorkspaces.set(false);
        const url = this.router.url;
        if (url === '/' || url === '') {
          this.router.navigate(['/workspaces', ws[0].id]);
        }
      } else {
        this.noWorkspaces.set(true);
      }
    });
  }

  toggleWsDropdown(event: Event) {
    event.stopPropagation();
    this.wsDropdownOpen.set(!this.wsDropdownOpen());
  }

  setSection(section: 'agents' | 'contents' | 'tov' | 'integrations') {
    this.navService.activeSection.set(section);
    const wsId = this.activeWsId();
    if (wsId) {
      this.router.navigate(['/workspaces', wsId, section]);
    }
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

  // Inline edit
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
    this.wsDropdownOpen.set(false);
    this.workspaceService.delete(ws.id).subscribe(() => {
      this.loadWorkspaces();
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
