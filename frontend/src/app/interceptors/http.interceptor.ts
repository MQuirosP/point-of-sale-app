import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class HttpConfigInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clonar la solicitud para añadir el nuevo encabezado
    const cloned = req.clone({
      setHeaders: {
        'Content-Type': 'application/json'
      }
    });

    // Pasar la solicitud clonada al siguiente manejador
    return next.handle(cloned);
  }
}
