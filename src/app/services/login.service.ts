import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private backendUrl = `${environment.apiUrl}users/`;
  private isLoggedInSubject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean> =
    this.isLoggedInSubject.asObservable();
  private readonly COOKIE_Name = 'username';
  private sessionTimeoutMinutes = 60;

  private sessionTimeoutTimer$: Observable<number>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService,
    private toastr: ToastrService
  ) {
    this.checkLoggedIn();

    this.sessionTimeoutTimer$ = this.isLoggedIn$.pipe(
      switchMap((isLoggedIn) => {
        if(isLoggedIn) {
          return timer(this.sessionTimeoutMinutes * 60 * 1000);
        } else {
          return of(null);
        }
      })
    );

    this.sessionTimeoutTimer$.subscribe(() => {
      this.logoutDueToInactivity();
    })
  };

  onLogin(username: string, password: string) {
    if (!username || !password) {
      this.toastr.warning('Ingrese usuario y contraseña.');
      return;
    }

    const loginData = {
      username: username,
      password: password,
    };

    this.http
      .post<any>(`${this.backendUrl}login/`, loginData)
      .pipe(
        tap((response) => {
          if (response.success === true) {
            const name = response.message.name;
            localStorage.setItem('token', response.message.token);
            this.cookieService.set(this.COOKIE_Name, name);
            this.setLoggedIn(true);
            this.toastr.success(
              `¡Bienvenido ${this.capitalizeFirstLetter(name)}!`
            );
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 500);
          } else {
            this.setLoggedIn(false);
            this.toastr.error('Credenciales inválidas.');
          }
        }),
        catchError((error) => {
          this.setLoggedIn(false);
          this.toastr.error(
            `Usuario ${this.capitalizeFirstLetter(username)} no registrado.`
          );
          return of(null);
        })
      )
      .subscribe();
  }

  private capitalizeFirstLetter(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  getUserName(): string {
    return this.cookieService.get(this.COOKIE_Name) || '';
  }

  onLogout() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.toastr.error('No se ha iniciado sesión.');
      return;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    });

    this.http
      .post<any>(`${this.backendUrl}logout/`, { token: token }, { headers })
      .pipe(
        tap(() => {
          localStorage.removeItem('token');
          this.setLoggedIn(false);
          this.cookieService.delete(this.COOKIE_Name);
          this.toastr.success('Sesión cerrada exitosamente.');
          this.router.navigate(['/login']);
        }),
        catchError((error) => {
          this.toastr.error('Error al cerrar sesión.');
          console.log(error);
          return of(null);
        })
      )
      .subscribe();
  }

  isLoggedIn(): Observable<boolean> {
    return this.isLoggedIn$;
  }

  isLoggedInValue(): boolean {
    return this.isLoggedInSubject.getValue();
  }

  setLoggedIn(value: boolean) {
    this.isLoggedInSubject.next(value);
  }

  checkLoggedIn(): void {
    const token = localStorage.getItem('token');
    this.setLoggedIn(!!token);
  }

  private logoutDueToInactivity() {
    if (this.isLoggedInSubject.getValue()) {
      this.toastr.warning('Sesión cerrada por inactividad.');
      this.onLogout();
    }
  }
}
