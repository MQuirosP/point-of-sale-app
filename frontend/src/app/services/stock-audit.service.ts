import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockAuditService {

  backendUrl: string = environment.apiUrl + "audits"

  constructor(
    private http: HttpClient,
  ) { }

  fetchAllAudits() {
    return this.http.get(`${this.backendUrl}`)
  }

  createAuditEntry(documentData: any) {
    return this.http.post(`${this.backendUrl}`, documentData)
  }
}
