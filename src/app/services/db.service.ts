import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private backendUrl = 'http://localhost:3000';
  constructor(private http: HttpClient) { }

  getAllProducts() {
    const url = `${this.backendUrl}/api/products`;
    console.log(`Hola Mario ${this.http.get(url)}`);
    return this.http.get(url);
  }
}
