import { Component } from '@angular/core';
import { fadeAnimation } from 'src/app/fadeAnimation';

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css'],
  animations: [fadeAnimation]
})
export class RegisterUserComponent {
  name: string = '';
  lastname: string = '';
  email: string = '';
  password: string = '';

  constructor () {}

  registro() {

  }
}
