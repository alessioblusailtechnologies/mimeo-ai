import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  email = '';
  password = '';
  fullName = '';
  error = signal('');
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.error.set('');
    this.loading.set(true);

    this.authService.register(this.email, this.password, this.fullName || undefined).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Registration failed');
        this.loading.set(false);
      },
    });
  }
}
