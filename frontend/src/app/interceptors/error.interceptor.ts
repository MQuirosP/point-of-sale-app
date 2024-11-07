import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../services/login.service';
import { CookieService } from 'ngx-cookie-service';
import { OptionsService } from '../services/optionsService';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastr: ToastrService,
    private cookieService: CookieService,
    private optionsService: OptionsService,
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0 || error.status === 401) {
          this.toastr.error('No hay comunicación con el servidor. Por favor verifique su conexión.');
          this.loginService.setLoggedIn(false); 
          this.optionsService.setAllowRegisterStatus(false);
          localStorage.clear(); 
          this.cookieService.deleteAll(); 
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
