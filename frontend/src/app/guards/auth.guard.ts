import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { LoginService } from '../services/login.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private loginService: LoginService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.loginService.isLoggedIn().pipe(
      tap((isLoggedIn) => {
        if (!isLoggedIn) {
          this.router.navigate(['/login']);
        }
      }),
      map((isLoggedIn) => {
        const status = localStorage.getItem('status');
        if (status === 'pending') {
          this.toastr.warning('El usuario está pendiente de aceptar.');
          this.router.navigate(['/login']);
          return false;
        } else if (status === 'suspended') {
          this.toastr.error('El usuario está suspendido.');
          return false;
        }
        return true;
      })
    );
  }
}
