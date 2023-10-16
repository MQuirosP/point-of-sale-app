import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
import { OptionsService } from 'src/app/services/optionsService';
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
export class RegisterUserComponent implements AfterViewInit {
  newUserForm: FormGroup;
  backendUrl = `${environment.apiUrl}users/`;
  userList: any[]=[];

  allowRegisterUsers$: Observable<boolean> = of(false);

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private optionsService: OptionsService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.getRegisterStatus();
    this.newUserForm = this.formBuilder.group({
      username: ['', Validators.required],
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      password: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    this.getUsersList();
  }
  
  ngAfterViewInit() {
    
  }

  getRegisterStatus() {
    this.optionsService.fetchRegisterStatus().subscribe((status) => {
      this.allowRegisterUsers$ = of(status);
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
        this.getUsersList();
      },
      error: (error: any) => {
        console.log(error);
        this.toastr.error(`Error al crear el usuario: ${error.message}`);
      },
    });
  }

  resetForm() {
    this.newUserForm.reset();
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

  getUsersList() {
    this.http.get(`${this.backendUrl}`).subscribe({
      next: (response: any) => {
        this.userList = response.message.Users
      },
      error: (error: any) => {
        console.log(error);
        this.toastr.error('Error recuperando la lista de usuarios.')
      }
    })
  }

  getStatusStyles(status: string) {
    switch (status) {
      case 'active':
        return { color: 'green' };
      case 'pending':
        return { color: 'blue' };
      case 'suspended':
        return { color: 'red' };
      default:
        return {};
    }
  }
}
