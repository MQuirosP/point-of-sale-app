import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { environment } from 'src/environments/environment';

interface NewUser {
  username: string;
  name: string;
  lastname: string;
  password: string;
  email: string;
}

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css'],
  animations: [fadeAnimation],
})
export class RegisterUserComponent implements OnInit {
  newUserForm: FormGroup;
  backendUrl = `${environment.apiUrl}users/`;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.newUserForm = this.formBuilder.group({
      username: ['', Validators.required],
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      password: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  registerNewUser() {
    if (this.newUserForm.invalid) {
      this.toastr.warning('Información incompleta o inválida. Por favor, complete todos los campos correctamente.');
      return;
    }

    const newUser: NewUser = this.newUserForm.value;

    this.http.get(`${this.backendUrl}${newUser.username}`).subscribe({
      next: (response: any) => {
        if (response.success === false) {
          this.createUser(newUser);
        } else {
          this.toastr.info(`Usuario ${newUser.username} ya existe en los registros.`);
        }
      },
      error: (error: any) => {
        if (error.status === 404) {
          this.createUser(newUser);
        } else {
          this.toastr.error('Error consultando usuario');
        }
      },
    });
  }

  private createUser(newUser: NewUser) {
    this.http.post(this.backendUrl, newUser).subscribe({
      next: (response: any) => {
        this.toastr.success(`Usuario creado satisfactoriamente: ${response.message.username}`);
        this.newUserForm.reset();
      },
      error: (error: any) => {
        this.toastr.error(`Error al crear el usuario: ${error.message}`);
      },
    });
  }

  addFloatingLabelClass(inputId: string) {
    const label = document.querySelector(`label[for="${inputId}"]`);
    label?.classList.add('active');
  }
  
  removeFloatingLabelClass(inputId: string) {
    const label = document.querySelector(`label[for="${inputId}"]`);
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input.value === '') {
      label?.classList.remove('active');
    }
  }
}
