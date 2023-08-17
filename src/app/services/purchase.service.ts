import { Toast, ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Purchase } from '../interfaces/purchases';

interface ApiPurchaseResponse {
  success: boolean;
  message: {
    Purchases: any[];
  };
}

@Injectable({
  providedIn: 'root'
})


export class PurchaseService {
  private backendUrl = environment.apiUrl; // URL de la api

  constructor(
    private http: HttpClient,
    ) {}

  createPurchase(purchase: Purchase): Observable<any> {
    return this.http.post(`${this.backendUrl}purchases`, purchase);
  }

  checkPurchaseDocNumber(purchase: string): Promise<boolean> {
  
    return new Promise<boolean>((resolve, reject) => {
      this.http.get<Purchase>(`${this.backendUrl}purchases/doc_number/${purchase}`).subscribe({
        next: (response: any) => {
          if (response.success) {
            resolve(true); // Documento encontrado en la base de datos
          } else {
            resolve(false); // Documento no encontrado en la base de datos
          }
        },
        error: (error: any) => {
          if (error.status === 404) {
            resolve(false); // Documento no encontrado en la base de datos
          } else {
            reject(error); // Error al realizar la solicitud HTTP
          }
        }
      });
    });
  }

  cancelPurchase(docNumber: string): Observable<any> {
    const url = `${this.backendUrl}purchases/${docNumber}`;
    return this.http.put(url, null);
  }

  getPurchasesByDate(selectedDate: string): Observable<ApiPurchaseResponse> {
    return this.http.get<ApiPurchaseResponse>(`${this.backendUrl}purchases/date/${selectedDate}`);
  }

  getProviders(): Observable<any> {
    return this.http.get(`${this.backendUrl}providers`);
  }
}
