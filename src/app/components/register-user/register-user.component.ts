import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { fadeAnimation } from 'src/app/fadeAnimation';

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css'],
  animations: [fadeAnimation],
})
export class RegisterUserComponent {
  username: string = '';
  name: string = '';
  lastname: string = '';
  // email: string = '';
  password: string = '';

  backendUrl = 'http://localhost:3000/api/users/';

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {}

  registerNewUser() {
    if (!this.username || !this.name || !this.lastname || !this.password) {
      this.toastr.warning(
        `Información incompleta, por favor complete todos los campos`
      );
      return;
    }
    const newUser = {
      username: this.username,
      name: this.name,
      lastname: this.lastname,
      // email: this.email,
      password: this.password,
    };
    this.http.get(`${this.backendUrl}${newUser.username}`).subscribe({
      next: (response: any) => {
        if (response.message) {
          this.toastr.info(`Usuario ${this.username} ya existe en los registros. `);
        } else {
          this.http.post(this.backendUrl, newUser).subscribe({
            next: (response: any) => {
              this.toastr.success(
                `Usuario creado satisfactoriamente: ${response.message.username}`
              );
              this.username = '';
              this.lastname = '';
              // this.email = '';
              this.name = '';
              this.password = '';
              // this.router.navigate(['/login'])
            },
            error: (error: any) => {
              this.toastr.error(`Error al crear el usuario: ${error.message}`);
            },
          });
        }
      },
      error: (error: any) => {
        this.toastr.error('Error consultando usuario');
      },
    });
  }
}
