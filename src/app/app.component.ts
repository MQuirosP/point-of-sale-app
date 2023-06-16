import { Component } from '@angular/core';
import { fadeAnimation } from './fadeAnimation';
import { LoginService } from './services/login.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [fadeAnimation]
})
export class AppComponent {
  title = 'frontend';

  constructor (
    private authService: LoginService,
  ) {}

  ngOnInit(): void {
    this.authService.checkLoggedIn();
  }
}
