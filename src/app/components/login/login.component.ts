import { Component } from '@angular/core';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { LoginService } from 'src/app/services/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [fadeAnimation],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  isLoggedIn: boolean = false;

  constructor(
    private authService: LoginService,
    ) {}

  onSubmit() {
    this.authService.onLogin(this.username, this.password);
    // this.authService.setLoggedIn(true);
  }
}
