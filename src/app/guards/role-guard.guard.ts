import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { LoginService } from '../services/login.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private loginService: LoginService, 
    private router: Router,
    private toastr: ToastrService,
    ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const role = localStorage.getItem('role');
    if (role === 'administrator') {
      return true; // Permitir acceso al componente o ruta para el rol de administrador
    } else {
      // Redirigir a una página de acceso denegado o mostrar un mensaje de error
      this.toastr.error("Usuario no autorizado")
      this.router.navigate(['/home']);
      return false;
    }
  }
}
