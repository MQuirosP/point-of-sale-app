import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
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

  private usernameSubject: BehaviorSubject<string> =
    new BehaviorSubject<string>('');
  private nameSubject: BehaviorSubject<string> = new BehaviorSubject<string>(
    ''
  );
  public username$: Observable<string> = this.usernameSubject.asObservable();
  public name$: Observable<string> = this.nameSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService,
    private toastr: ToastrService,
  ) {
    this.checkLoggedIn();

    this.sessionTimeoutTimer$ = this.isLoggedIn$.pipe(
      switchMap((isLoggedIn) => {
        if (isLoggedIn) {
          return timer(this.sessionTimeoutMinutes * 60 * 1000);
        } else {
          return of(null);
        }
      })
    );

    this.sessionTimeoutTimer$.subscribe(() => {
      this.logoutDueToInactivity();
    });
  }

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
          if (response.success === true && response.message.status === 'active') {
            const { username, name, role, status } = response.message;
            localStorage.setItem('token', response.message.token);
            localStorage.setItem('username', username);
            localStorage.setItem('name', name);
            localStorage.setItem('role', role); // Guardar la propiedad 'role'
            localStorage.setItem('status', status); // Guardar la propiedad 'status'
            this.cookieService.set(this.COOKIE_Name, name);
            this.setLoggedIn(true, username, name);
            this.toastr.success(
              `¡Bienvenido ${this.capitalizeFirstLetter(name)}!`
            );
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 500);
          } else if (response.success === true && response.message.status === 'suspended') {
            this.toastr.error('Usuario está suspendido.')
            this.setLoggedIn(false, '', '');
          }else if (response.success === true && response.message.status === 'pending') {
            this.toastr.error('Usuario ya está registrado pero está pendiente de aceptación por parte del administrador.')
            this.setLoggedIn(false, '', '');
            
          } else {
            this.setLoggedIn(false, '', '');
            this.toastr.error('Credenciales inválidas.');
          }
        }),
        catchError((error) => {
          this.setLoggedIn(false, '', '');
          console.log(error);
          this.toastr.error(
            `Error registrando el usuario ${this.capitalizeFirstLetter(
              username
            )}. Valide las credenciales.`
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
          localStorage.removeItem('username');
          localStorage.removeItem('name');
          localStorage.removeItem('role');
          localStorage.removeItem('status');
          this.setLoggedIn(false, '', '');
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

  setLoggedIn(value: boolean, username?: string, name?: string) {
    this.isLoggedInSubject.next(value);
    if (username) {
      localStorage.setItem('username', username);
    }
    if (name) {
      localStorage.setItem('name', name);
    }
  }

  checkLoggedIn(): void {
    const token = localStorage.getItem('token');
    this.setLoggedIn(
      !!token,
      localStorage.getItem('username') || '',
      localStorage.getItem('name') || ''
    );
  }

  private logoutDueToInactivity() {
    if (this.isLoggedInSubject.getValue()) {
      this.toastr.warning('Sesión cerrada por inactividad.');
      this.onLogout();
    }
  }

  createBackup() {
    this.http.get(`http://localhost:3000/backup`).subscribe({
      next: (response: any) => {
        this.toastr.success('El respaldo se ha creado exitosamente.');
      },
      error: (error) => {
        this.toastr.error('Error al crear el respaldo:', error);
      },
    });
  }

  changePassword(
    username: string,
    currentPassword: string,
    newPassword: string
  ): Observable<any> {
    const token = localStorage.getItem('token');

    if (!token) {
      return throwError(() => new Error('No se ha iniciado sesión.'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    });

    const passwordData = {
      username: localStorage.getItem('username'),
      currentPassword: currentPassword,
      newPassword: newPassword,
    };

    return this.http
      .post<any>(`${this.backendUrl}${username}changePassword/`, passwordData, {
        headers,
      })
      .pipe(
        tap(() => {
          // Aquí podemos realizar cualquier acción adicional después de cambiar la contraseña
        }),
        catchError((error) => {
          const errorMessage =
            error.error.error || 'Error al cambiar la contraseña.';
          return throwError(() => new Error(errorMessage));
        })
      );
  }
}
