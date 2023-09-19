import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockAuditService {

  backendUrl: string = environment.apiUrl + "stock-audit"

  constructor(
    private http: HttpClient,
  ) { }

  fetchAllAudits() {
    return this.http.get(`${this.backendUrl}`)
  }
}
