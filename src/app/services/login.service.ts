import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private backendUrl = 'http://localhost:3000/api/users/';
  private isLoggedInSubject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean> =
    this.isLoggedInSubject.asObservable();
  private username: string = '';

  private readonly COOKIE_Name = 'username';

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cookieService: CookieService,
    ) {
  }

  onLogin(username: string, password: string) {
    const loginData = {
      username: username,
      password: password,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + environment.SECRET_KEY,
    });
    this.http
      .post<any>(`${this.backendUrl}login/`, loginData, { headers })
      .pipe(
        tap((response) => {
          if (response.success === true) {
            localStorage.setItem('token', response.message.token);
            const name = response.message.name;
            this.cookieService.set(this.COOKIE_Name, name);
            this.setLoggedIn(true);
            this.router.navigate(['/home'])
          } else {
            this.setLoggedIn(false);
          }
        }),
        catchError((error) => {
          alert('Credenciales inválidas');
          console.log(error);
          return of(null);
        })
      )
      .subscribe();
  }

  getUserName(): string {
    return this.cookieService.get(this.COOKIE_Name) || '';
  }

  onLogout() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token'),
    });
    this.http
      .post<any>(
        `${this.backendUrl}logout/`,
        { token: localStorage.getItem('token') },
        { headers }
      )
      .pipe(
        tap(() => {
          localStorage.removeItem('token');
          this.setLoggedIn(false);
          this.cookieService.delete(this.COOKIE_Name);
          this.username = '';
        }),
        catchError((error) => {
          alert('Error al cerrar sesión');
          console.log(error);
          return of(null);
        })
      )
      .subscribe(() => {
        this.router.navigate(['/login']);
      });
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
    if (token) {
      this.setLoggedIn(true);
    } else {
      this.setLoggedIn(false);
    }
  }
}
