import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanActivate,
} from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private toastr: ToastrService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.checkRoleAccess().pipe(
      map((hasAccess) => {
        if (hasAccess) {
          return true; // Permitir acceso al componente o ruta para el rol de administrador
        } else {
          // Redirigir a una página de acceso denegado o mostrar un mensaje de error
          this.toastr.error('Usuario no autorizado.');
          return false;
        }
      })
    );
  }

  private checkRoleAccess(): Observable<boolean> {
    const role = localStorage.getItem('role');
    return of(role === 'administrator');
  }
}
