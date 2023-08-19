import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class OptionsService {

  private registerStatusSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private backendUrl = `${environment.apiUrl}options`
  id = 1;
  
  constructor(
    private http: HttpClient,
  ) { }

  // getRegisterStatus(): Observable<boolean> {
  //   return this.registerStatusSubject.asObservable().pipe(distinctUntilChanged());
  // }

  setAllowRegisterStatus(status: boolean) {
    this.registerStatusSubject.next(status);
  }

  fetchRegisterStatus(): Observable<boolean> {
    return this.http.get<boolean>(`${this.backendUrl}/${this.id}`).pipe(
      map((response: any) => {
        const options = response.message.options;
        const activateRegister = options.activateRegister;
        return Boolean(activateRegister);
      }),
      tap((status: boolean) => {
        this.registerStatusSubject.next(status);
      })
    )
  }

  changeRegisterStatus(status: boolean) {
    return this.http.put(`${this.backendUrl}/${this.id}`, { activateRegister: status}).pipe(
      tap(() => {
        this.registerStatusSubject.next(status)
      })
    )
  }
}
