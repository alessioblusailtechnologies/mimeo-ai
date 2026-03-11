import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.loadUser();
  }
}
