import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authToken = localStorage.getItem('token');

    if (authToken) {
      const authRequest = request.clone({
        setHeaders: {
          Authorization: authToken
        }
      });
      return next.handle(authRequest);
    }

    return next.handle(request);
  }
}
